-- Real storage for donation photos. Previously the Donate form only
-- counted files selected; nothing was ever uploaded, so admins reviewing
-- donations had nothing to look at and the AI category suggestion
-- (already computed client-side) had no record of what it saw.

-- 1. Record what the on-device AI classifier suggested, for admin review.
alter table public.donations add column ai_suggested_category text;
alter table public.donations add column ai_confidence numeric;

-- 2. Photos, one row per file, several photos per donation.
create table public.donation_photos (
  id uuid primary key default gen_random_uuid(),
  donation_id uuid not null references public.donations (id) on delete cascade,
  storage_path text not null,
  created_at timestamptz not null default now()
);

alter table public.donation_photos enable row level security;

-- Guest donations have no session to check ownership against, and a plain
-- subquery on `donations` here would hit the same RLS-recursion trap fixed
-- in 0010 (order_items): the subquery is itself subject to donations' own
-- RLS, which only grants a signed-in owner visibility into their own row,
-- not a guest into their own null-user_id row. Reusing the security
-- definer pattern already established for guest orders.
create function public.donation_is_insertable(p_donation_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.donations d
    where d.id = p_donation_id and (d.user_id is null or d.user_id = auth.uid())
  );
$$;

grant execute on function public.donation_is_insertable(uuid) to anon, authenticated;

create policy "photos can be added alongside their donation"
  on public.donation_photos for insert
  with check (public.donation_is_insertable(donation_id));

-- Reading is narrower than writing on purpose: only a signed-in owner or
-- an admin can view a donation's photos back. A guest who just submitted
-- doesn't get a "view my upload" feature, so no read policy is needed for
-- anon here -- this matches there being no guest donation-viewing UI today.
create policy "owners and admins can view donation photos"
  on public.donation_photos for select
  using (
    public.is_admin()
    or exists (select 1 from public.donations d where d.id = donation_id and d.user_id = auth.uid())
  );

create policy "admins can delete donation photos"
  on public.donation_photos for delete
  using (public.is_admin());

-- 3. The storage bucket itself -- private, with a server-side size/type
-- backstop behind the client-side compression.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('donation-photos', 'donation-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "donation photo upload matches an insertable donation"
  on storage.objects for insert
  with check (
    bucket_id = 'donation-photos'
    and public.donation_is_insertable((storage.foldername(name))[1]::uuid)
  );

create policy "donation photo read matches owner or admin"
  on storage.objects for select
  using (
    bucket_id = 'donation-photos'
    and (
      public.is_admin()
      or exists (
        select 1 from public.donations d
        where d.id = (storage.foldername(name))[1]::uuid and d.user_id = auth.uid()
      )
    )
  );

create policy "admins can delete donation photo files"
  on storage.objects for delete
  using (bucket_id = 'donation-photos' and public.is_admin());
