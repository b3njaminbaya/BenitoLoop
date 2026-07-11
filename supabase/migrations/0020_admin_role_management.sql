-- Admin role management, plus a real fix for a privilege-escalation hole
-- discovered while building it: "profiles are editable by their owner" had
-- a USING clause (which row) but no WITH CHECK (which values), and the
-- table had a blanket UPDATE grant -- so any signed-in user could call
-- `supabase.from('profiles').update({ role: 'admin' }).eq('id', ...)`
-- directly from the browser console and self-promote. Nothing in the UI
-- did this, but RLS is the actual security boundary, not the UI.
--
-- Fix: users can only ever update their own full_name (column-level grant),
-- and role changes go exclusively through set_user_role(), which verifies
-- the caller is already an admin. This also removes the standing need for
-- me to run ad hoc SQL every time you want to promote a team member.

revoke update on public.profiles from authenticated;
grant update (full_name) on public.profiles to authenticated;

drop policy "profiles are editable by their owner" on public.profiles;
create policy "profiles are editable by their owner"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create function public.set_user_role(p_user_id uuid, p_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can change user roles';
  end if;
  if p_role not in ('donor', 'buyer', 'partner', 'admin') then
    raise exception 'Invalid role: %', p_role;
  end if;
  if p_user_id = auth.uid() and p_role <> 'admin' then
    raise exception 'You cannot remove your own admin access';
  end if;

  update public.profiles set role = p_role where id = p_user_id;
end;
$$;

grant execute on function public.set_user_role(uuid, text) to authenticated;

-- auth.users isn't reachable via the client API, so the admin user list
-- (which needs an email to be useful) is served through a function that
-- joins it server-side and is silently empty for non-admins, matching the
-- pattern used by get_product_provenance.
create function public.list_users_with_roles()
returns table (id uuid, email text, full_name text, role text, created_at timestamptz)
language sql
security definer
set search_path = public
stable
as $$
  select p.id, u.email, p.full_name, p.role, p.created_at
  from public.profiles p
  join auth.users u on u.id = p.id
  where public.is_admin()
  order by p.created_at desc;
$$;

grant execute on function public.list_users_with_roles() to authenticated;

create trigger audit_profile_role_changes
  after update on public.profiles
  for each row
  when (old.role is distinct from new.role)
  execute procedure public.log_admin_action();
