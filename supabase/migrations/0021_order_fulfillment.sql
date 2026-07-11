-- Order fulfillment & shipping with tracking. Today "fulfilled" is a single
-- terminal status with no tracking data attached -- there's no way to tell
-- a customer their order is on its way, only that it eventually arrived.
--
-- Adds a `shipped` status between `paid` and `fulfilled` (dispatched with a
-- tracking number vs. confirmed delivered), plus the tracking fields
-- themselves. `fulfilled_at` is set by a trigger rather than trusted from
-- the client, for an honest record of when delivery was actually confirmed.

alter table public.orders drop constraint orders_status_check;
alter table public.orders add constraint orders_status_check check (
  status in ('pending_payment', 'awaiting_manual_payment', 'paid', 'payment_failed', 'shipped', 'fulfilled', 'cancelled')
);

alter table public.orders add column shipping_carrier text;
alter table public.orders add column tracking_number text;
alter table public.orders add column fulfilled_at timestamptz;

create function public.set_order_fulfilled_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'fulfilled' and old.status is distinct from 'fulfilled' then
    new.fulfilled_at = now();
  end if;
  return new;
end;
$$;

create trigger set_orders_fulfilled_at
  before update on public.orders
  for each row execute procedure public.set_order_fulfilled_at();

-- Ship an order atomically: status and tracking info are set together so a
-- shipped order is never missing its tracking number, and vice versa.
create function public.mark_order_shipped(p_order_id uuid, p_carrier text, p_tracking_number text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can update order fulfillment';
  end if;
  if p_tracking_number is null or btrim(p_tracking_number) = '' then
    raise exception 'A tracking number is required';
  end if;

  update public.orders
  set status = 'shipped', shipping_carrier = p_carrier, tracking_number = p_tracking_number
  where id = p_order_id;
end;
$$;

grant execute on function public.mark_order_shipped(uuid, text, text) to authenticated;

-- Extend the transactional-email trigger (migration 0016) to notify on shipment too.
create or replace function public.notify_order_email()
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
  elsif TG_OP = 'UPDATE' and new.status = 'shipped' and old.status is distinct from 'shipped' then
    perform public.queue_transactional_email(
      'order_shipped',
      new.customer_email,
      'order',
      new.id,
      jsonb_build_object(
        'customerName', new.customer_name,
        'orderId', new.id,
        'shippingCarrier', new.shipping_carrier,
        'trackingNumber', new.tracking_number
      )
    );
  end if;
  return new;
end;
$$;
