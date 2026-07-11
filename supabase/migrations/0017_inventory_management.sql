-- Inventory management. Until now `products.stock` was purely decorative --
-- admins could set it, but nothing ever read it at checkout and nothing
-- ever decremented it, so the same "last one in stock" item could be sold
-- to multiple concurrent buyers.
--
-- Design: order creation moves from two separate client-side inserts
-- (orders, then order_items) into a single atomic function. It locks each
-- product row (`for update`), checks stock, decrements it, and only then
-- inserts the order -- all inside one transaction, so a second concurrent
-- checkout for the same product blocks on the row lock and sees the
-- decremented stock once it proceeds. Items are locked in a stable sorted
-- order to avoid deadlocking two carts that share products in different
-- orders.
--
-- If an order later fails payment or is cancelled, a trigger restocks the
-- items -- otherwise stock reserved by an abandoned or declined order would
-- be lost permanently.
--
-- Direct inserts into orders/order_items are revoked from anon/authenticated
-- so the atomic function is the only path that can create an order --
-- otherwise a client could bypass stock checking entirely by calling
-- .insert() directly, same as before this migration.

create or replace function public.create_order(
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text,
  p_shipping_address text,
  p_items jsonb
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

  insert into public.orders (id, total_amount, customer_name, customer_phone, customer_email, shipping_address)
  values (v_order_id, v_total, p_customer_name, p_customer_phone, p_customer_email, p_shipping_address);

  insert into public.order_items (order_id, product_id, title, price, quantity)
  select v_order_id, (value ->> 'product_id')::uuid, value ->> 'title', (value ->> 'price')::numeric, (value ->> 'quantity')::int
  from jsonb_array_elements(p_items);

  return v_order_id;
end;
$$;

grant execute on function public.create_order(text, text, text, text, jsonb) to anon, authenticated;

revoke insert on public.orders from anon, authenticated;
revoke insert on public.order_items from anon, authenticated;

drop policy if exists "anyone can create an order" on public.orders;
drop policy if exists "order items can be created alongside their order" on public.order_items;

-- Restock when an order fails payment or is cancelled after stock was
-- already reserved at creation time.
create function public.restock_on_order_failure()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status in ('payment_failed', 'cancelled') and old.status not in ('payment_failed', 'cancelled') then
    update public.products p
    set stock = p.stock + oi.quantity
    from public.order_items oi
    where oi.order_id = new.id and oi.product_id = p.id;
  end if;
  return new;
end;
$$;

create trigger restock_on_order_status_change
  after update on public.orders
  for each row execute procedure public.restock_on_order_failure();
