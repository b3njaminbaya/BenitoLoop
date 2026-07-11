-- Donation-to-product traceability: "this tote bag was made from jackets
-- donated in March." A product can be made from multiple donations (a
-- patchwork item might use several garments), and a single large donation
-- could in principle contribute to more than one product, so this is a
-- many-to-many join table, not a foreign key on either side.
--
-- Donations are otherwise private (donors can only see their own; guests
-- who donate without an account can't see theirs at all after submitting).
-- To tell the traceability story publicly without loosening that, storefront
-- access goes through a security-definer function that returns only the
-- fields that are safe and meaningful to show a shopper (title, category,
-- when it was donated) -- never user_id, notes, or anything else -- and
-- only for donations linked to a product that is actually published.

create table public.product_donations (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  donation_id uuid not null references public.donations (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (product_id, donation_id)
);

alter table public.product_donations enable row level security;

create policy "admins manage product-donation links"
  on public.product_donations for all
  using (public.is_admin())
  with check (public.is_admin());

create function public.get_product_provenance(p_product_id uuid)
returns table (donation_id uuid, title text, category text, donated_at timestamptz)
language sql
security definer
set search_path = public
stable
as $$
  select d.id, d.title, d.category, d.created_at
  from public.product_donations pd
  join public.donations d on d.id = pd.donation_id
  join public.products p on p.id = pd.product_id
  where pd.product_id = p_product_id
    and (p.status = 'published' or public.is_admin())
  order by d.created_at asc;
$$;

grant execute on function public.get_product_provenance(uuid) to anon, authenticated;

create trigger audit_product_donations
  after insert or update or delete on public.product_donations
  for each row execute procedure public.log_admin_action();
