-- Product reviews & ratings with moderation. New reviews default to
-- 'pending' and only ever become publicly visible once an admin approves
-- them -- same approval-queue pattern already used for donations and
-- partner applications, rather than showing content live and cleaning up
-- after the fact.
--
-- verified_purchase is computed server-side from the reviewer's own paid
-- order history (never trusted from the client), so it can't be spoofed.
-- Reviewer names are exposed to the public only through a narrowly-scoped
-- function (same pattern as get_product_provenance / list_users_with_roles)
-- rather than loosening profiles' own RLS, which stays owner-only.

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  rating int not null check (rating between 1 and 5),
  title text,
  body text,
  verified_purchase boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  unique (product_id, user_id)
);

alter table public.reviews enable row level security;

create policy "signed-in users can submit a review"
  on public.reviews for insert
  with check (auth.uid() = user_id);

create policy "reviewers can view their own reviews regardless of status"
  on public.reviews for select
  using (auth.uid() = user_id);

create policy "reviewers can delete their own review"
  on public.reviews for delete
  using (auth.uid() = user_id);

create policy "admins can view all reviews"
  on public.reviews for select
  using (public.is_admin());

create policy "admins can moderate reviews"
  on public.reviews for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "admins can delete any review"
  on public.reviews for delete
  using (public.is_admin());

create function public.set_review_verified_purchase()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.verified_purchase := exists (
    select 1 from public.order_items oi
    join public.orders o on o.id = oi.order_id
    where oi.product_id = new.product_id
      and o.user_id = new.user_id
      and o.status in ('paid', 'shipped', 'fulfilled')
  );
  return new;
end;
$$;

create trigger set_review_verified_purchase
  before insert on public.reviews
  for each row execute procedure public.set_review_verified_purchase();

create trigger audit_reviews
  after insert or update or delete on public.reviews
  for each row execute procedure public.log_admin_action();

-- Public storefront: approved reviews for a product, with the reviewer's
-- name joined server-side (profiles stays owner-only otherwise).
create function public.list_approved_reviews(p_product_id uuid)
returns table (
  id uuid,
  rating int,
  title text,
  body text,
  verified_purchase boolean,
  reviewer_name text,
  created_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select r.id, r.rating, r.title, r.body, r.verified_purchase,
         coalesce(p.full_name, 'Nyuzi customer'), r.created_at
  from public.reviews r
  join public.profiles p on p.id = r.user_id
  where r.product_id = p_product_id and r.status = 'approved'
  order by r.created_at desc;
$$;

grant execute on function public.list_approved_reviews(uuid) to anon, authenticated;

-- Admin moderation queue: every review regardless of status, with product
-- title and reviewer email for context. Silently empty for non-admins.
create function public.list_reviews_for_moderation()
returns table (
  id uuid,
  product_id uuid,
  product_title text,
  rating int,
  review_title text,
  review_body text,
  verified_purchase boolean,
  status text,
  reviewer_name text,
  reviewer_email text,
  created_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select r.id, r.product_id, pr.title, r.rating, r.title, r.body, r.verified_purchase, r.status,
         coalesce(p.full_name, 'Unknown'), u.email, r.created_at
  from public.reviews r
  join public.products pr on pr.id = r.product_id
  join public.profiles p on p.id = r.user_id
  join auth.users u on u.id = r.user_id
  where public.is_admin()
  order by (r.status = 'pending') desc, r.created_at desc;
$$;

grant execute on function public.list_reviews_for_moderation() to authenticated;
