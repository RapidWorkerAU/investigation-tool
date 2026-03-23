-- Prevent signup flow from treating existing email addresses as new accounts.

create or replace function public.email_exists_for_auth(p_email text)
returns boolean
language sql
security definer
set search_path = public, auth
stable
as $$
  select exists (
    select 1
    from auth.users u
    where lower(u.email) = lower(nullif(btrim(coalesce(p_email, '')), ''))
  );
$$;

revoke all on function public.email_exists_for_auth(text) from public;
grant execute on function public.email_exists_for_auth(text) to anon, authenticated;
