-- 20260312_011_backfill_profile_emails.sql
-- Backfill and maintain profile emails so dashboard/profile joins can resolve user emails.

update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id
  and coalesce(p.email, '') = '';

create or replace function public.sync_profile_email_from_auth()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set email = new.email
  where id = new.id
    and coalesce(email, '') is distinct from coalesce(new.email, '');

  return new;
end;
$$;

drop trigger if exists trg_sync_profile_email_from_auth on auth.users;
create trigger trg_sync_profile_email_from_auth
after update of email on auth.users
for each row
execute function public.sync_profile_email_from_auth();
