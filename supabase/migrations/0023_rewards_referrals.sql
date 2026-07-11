-- Rewards & referral system. Every account gets a unique referral code;
-- when someone signs up through a referral link and their first order is
-- paid, both the referrer and the new customer get store credit,
-- redeemable against a future order's total. Credit balance changes only
-- ever happen through security-definer functions/triggers below -- direct
-- client writes to profiles are already locked to full_name only
-- (migration 0020), so this can't be self-granted.

alter table public.profiles add column referral_code text unique;
alter table public.profiles add column referred_by uuid references public.profiles (id) on delete set null;
alter table public.profiles add column credit_balance numeric(10, 2) not null default 0 check (credit_balance >= 0);
alter table public.profiles add column referral_reward_granted boolean not null default false;

create function public.generate_referral_code()
returns text
language plpgsql
as $$
declare
  v_code text;
begin
  loop
    v_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
    exit when not exists (select 1 from public.profiles where referral_code = v_code);
  end loop;
  return v_code;
end;
$$;

update public.profiles set referral_code = public.generate_referral_code() where referral_code is null;

alter table public.profiles alter column referral_code set not null;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_referrer_id uuid;
  v_ref_code text;
begin
  v_ref_code := new.raw_user_meta_data ->> 'referral_code';
  if v_ref_code is not null and btrim(v_ref_code) <> '' then
    select id into v_referrer_id from public.profiles where referral_code = upper(btrim(v_ref_code));
  end if;

  insert into public.profiles (id, full_name, referral_code, referred_by)
  values (new.id, new.raw_user_meta_data ->> 'full_name', public.generate_referral_code(), v_referrer_id);
  return new;
end;
$$;

-- How much of an order's total was covered by credit, and the atomic
-- deduction path -- redemption happens inside create_order (migration
-- 0017), never as a separate client-side balance update.
alter table public.orders add column credit_applied numeric(10, 2) not null default 0;

create or replace function public.create_order(
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text,
  p_shipping_address text,
  p_items jsonb,
  p_apply_credit boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid := gen_random_uuid();
  v_total numeric(10, 2) := 0;
  v_item jsonb;
  v_product_id uuid;
  v_qty int;
  v_price numeric(10, 2);
  v_title text;
  v_stock int;
  v_credit_available numeric(10, 2) := 0;
  v_credit_applied numeric(10, 2) := 0;
begin
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'Your cart is empty';
  end if;

  for v_item in
    select value from jsonb_array_elements(p_items) order by (value ->> 'product_id')
  loop
    v_product_id := (v_item ->> 'product_id')::uuid;
    v_qty := (v_item ->> 'quantity')::int;
    v_title := v_item ->> 'title';
    v_price := (v_item ->> 'price')::numeric;

    if v_qty is null or v_qty <= 0 then
      raise exception 'Invalid quantity for "%"', v_title;
    end if;

    select stock into v_stock
    from public.products
    where id = v_product_id and status = 'published'
    for update;

    if v_stock is null then
      raise exception '"%" is no longer available', v_title;
    end if;

    if v_stock < v_qty then
      raise exception 'Only % left of "%"', v_stock, v_title;
    end if;

    update public.products set stock = stock - v_qty where id = v_product_id;

    v_total := v_total + (v_price * v_qty);
  end loop;

  if p_apply_credit and auth.uid() is not null then
    select credit_balance into v_credit_available from public.profiles where id = auth.uid();
    v_credit_applied := least(coalesce(v_credit_available, 0), v_total);
  end if;

  insert into public.orders (
    id, user_id, total_amount, credit_applied, customer_name, customer_phone, customer_email, shipping_address
  )
  values (
    v_order_id, auth.uid(), v_total - v_credit_applied, v_credit_applied,
    p_customer_name, p_customer_phone, p_customer_email, p_shipping_address
  );

  if v_credit_applied > 0 then
    update public.profiles set credit_balance = credit_balance - v_credit_applied where id = auth.uid();
  end if;

  insert into public.order_items (order_id, product_id, title, price, quantity)
  select v_order_id, (value ->> 'product_id')::uuid, value ->> 'title', (value ->> 'price')::numeric, (value ->> 'quantity')::int
  from jsonb_array_elements(p_items);

  return v_order_id;
end;
$$;

grant execute on function public.create_order(text, text, text, text, jsonb, boolean) to anon, authenticated;

-- Grant the referral reward the first time a referred customer's order is paid.
create function public.grant_referral_reward()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_referrer_id uuid;
  v_already_granted boolean;
  v_referrer_email text;
  v_referee_email text;
  v_referrer_reward numeric := 200;
  v_referee_reward numeric := 100;
begin
  if new.status = 'paid' and old.status is distinct from 'paid' and new.user_id is not null then
    select referred_by, referral_reward_granted into v_referrer_id, v_already_granted
    from public.profiles where id = new.user_id;

    if v_referrer_id is not null and not v_already_granted then
      update public.profiles set credit_balance = credit_balance + v_referrer_reward where id = v_referrer_id;
      update public.profiles set credit_balance = credit_balance + v_referee_reward, referral_reward_granted = true
        where id = new.user_id;

      select email into v_referrer_email from auth.users where id = v_referrer_id;
      select email into v_referee_email from auth.users where id = new.user_id;

      perform public.queue_transactional_email(
        'referral_reward_referrer', v_referrer_email, 'order', new.id,
        jsonb_build_object('amount', v_referrer_reward)
      );
      perform public.queue_transactional_email(
        'referral_reward_referee', v_referee_email, 'order', new.id,
        jsonb_build_object('amount', v_referee_reward)
      );
    end if;
  end if;
  return new;
end;
$$;

create trigger grant_referral_reward_on_order_paid
  after update on public.orders
  for each row execute procedure public.grant_referral_reward();
