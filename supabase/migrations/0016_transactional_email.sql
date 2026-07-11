-- Transactional email infrastructure. Orders, donations, and partner
-- applications currently write to the database with no follow-up
-- communication -- customers get a banner in the UI and nothing else.
--
-- Design: a `send-email` edge function wraps the Resend API. Postgres
-- triggers on the three tables call it asynchronously via pg_net whenever
-- something worth emailing about happens, so delivery doesn't depend on
-- the client staying on the page (a guest closing the tab right after
-- checkout still gets their confirmation). A shared secret in Supabase
-- Vault authenticates the DB -> edge function hop; nothing sensitive is
-- committed to this file.
--
-- Every email is queued through queue_transactional_email(), which logs to
-- email_log first and always returns normally -- a missing recipient, a
-- misconfigured secret, or a Resend outage never blocks the underlying
-- order/donation/application write.

create extension if not exists pg_net with schema extensions;

do $$
begin
  if not exists (select 1 from vault.secrets where name = 'email_webhook_secret') then
    perform vault.create_secret(
      encode(gen_random_bytes(32), 'hex'),
      'email_webhook_secret',
      'Shared secret the DB uses to authenticate calls to the send-email edge function'
    );
  end if;
end $$;

create table public.email_log (
  id uuid primary key default gen_random_uuid(),
  template text not null,
  recipient text,
  entity_type text not null,
  entity_id uuid,
  status text not null default 'queued' check (
    status in ('queued', 'sent', 'failed', 'skipped_no_email', 'skipped_not_configured')
  ),
  error text,
  created_at timestamptz not null default now()
);

alter table public.email_log enable row level security;

create policy "admins can view the email log"
  on public.email_log for select
  using (public.is_admin());

-- No insert/update policy for any role -- the only writers are the
-- security-definer functions below (queue_transactional_email) and the
-- edge function itself (via the service role, which bypasses RLS).

create function public.queue_transactional_email(
  p_template text,
  p_recipient text,
  p_entity_type text,
  p_entity_id uuid,
  p_payload jsonb
)
returns void
language plpgsql
security definer
set search_path = public, extensions, vault
as $$
declare
  v_secret text;
  v_log_id uuid;
begin
  if p_recipient is null or btrim(p_recipient) = '' then
    insert into public.email_log (template, recipient, entity_type, entity_id, status)
    values (p_template, p_recipient, p_entity_type, p_entity_id, 'skipped_no_email');
    return;
  end if;

  insert into public.email_log (template, recipient, entity_type, entity_id, status)
  values (p_template, p_recipient, p_entity_type, p_entity_id, 'queued')
  returning id into v_log_id;

  select decrypted_secret into v_secret
  from vault.decrypted_secrets
  where name = 'email_webhook_secret';

  perform net.http_post(
    url := 'https://reuebpcpxzuiivbvteig.supabase.co/functions/v1/send-email',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-webhook-secret', v_secret),
    body := jsonb_build_object(
      'logId', v_log_id,
      'template', p_template,
      'recipient', p_recipient,
      'payload', p_payload
    )
  );
end;
$$;

-- Orders: confirm on creation, notify when M-Pesa payment clears.
create function public.notify_order_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if TG_OP = 'INSERT' then
    perform public.queue_transactional_email(
      'order_confirmation',
      new.customer_email,
      'order',
      new.id,
      jsonb_build_object(
        'customerName', new.customer_name,
        'orderId', new.id,
        'totalAmount', new.total_amount,
        'shippingAddress', new.shipping_address
      )
    );
  elsif TG_OP = 'UPDATE' and new.status = 'paid' and old.status is distinct from 'paid' then
    perform public.queue_transactional_email(
      'order_paid',
      new.customer_email,
      'order',
      new.id,
      jsonb_build_object(
        'customerName', new.customer_name,
        'orderId', new.id,
        'totalAmount', new.total_amount,
        'mpesaReceipt', new.mpesa_receipt_number
      )
    );
  end if;
  return new;
end;
$$;

create trigger email_on_order_change
  after insert or update on public.orders
  for each row execute procedure public.notify_order_email();

-- Donations: acknowledge on submission. Guests who don't sign in have no
-- email on file (the donation form never collects one), so this is a
-- best-effort send -- queue_transactional_email logs and skips cleanly
-- when v_email is null rather than failing the donation.
create function public.notify_donation_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
begin
  if new.user_id is not null then
    select email into v_email from auth.users where id = new.user_id;
  end if;

  perform public.queue_transactional_email(
    'donation_acknowledgement',
    v_email,
    'donation',
    new.id,
    jsonb_build_object(
      'title', new.title,
      'category', new.category,
      'pickupRequested', new.pickup_requested
    )
  );
  return new;
end;
$$;

create trigger email_on_donation_insert
  after insert on public.donations
  for each row execute procedure public.notify_donation_email();

-- Partner applications: confirm on submission, notify on approve/reject.
create function public.notify_partner_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if TG_OP = 'INSERT' then
    perform public.queue_transactional_email(
      'partner_application_received',
      new.email,
      'partner_application',
      new.id,
      jsonb_build_object(
        'fullName', new.full_name,
        'organization', new.organization,
        'partnershipType', new.partnership_type
      )
    );
  elsif TG_OP = 'UPDATE' and new.status is distinct from old.status and new.status in ('approved', 'rejected') then
    perform public.queue_transactional_email(
      case new.status when 'approved' then 'partner_application_approved' else 'partner_application_rejected' end,
      new.email,
      'partner_application',
      new.id,
      jsonb_build_object('fullName', new.full_name, 'organization', new.organization)
    );
  end if;
  return new;
end;
$$;

create trigger email_on_partner_application_change
  after insert or update on public.partner_applications
  for each row execute procedure public.notify_partner_email();

-- Run this after the migration and share the result so the edge function
-- can be configured with the matching secret:
-- select decrypted_secret from vault.decrypted_secrets where name = 'email_webhook_secret';
