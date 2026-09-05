-- Passwords never belong in migrations. This migration provisions the profile
-- for the explicitly named Auth account whether it exists before or after run.
create or replace function private.provision_staff_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles(id,display_name,role,is_active)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name',''), split_part(new.email,'@',1)),
    case when lower(new.email)='admin@admin.com' then 'manager' else 'seo' end,
    lower(new.email)='admin@admin.com'
  )
  on conflict(id) do update set
    role=case when lower(new.email)='admin@admin.com' then 'manager' else public.profiles.role end,
    is_active=case when lower(new.email)='admin@admin.com' then true else public.profiles.is_active end;
  return new;
end;
$$;
revoke all on function private.provision_staff_profile() from public,anon,authenticated;
drop trigger if exists provision_staff_profile_after_signup on auth.users;
create trigger provision_staff_profile_after_signup after insert or update of email on auth.users for each row execute function private.provision_staff_profile();
insert into public.profiles(id,display_name,role,is_active)
select id,coalesce(nullif(raw_user_meta_data ->> 'display_name',''),'مدیریت دیار صنعت'),'manager',true
from auth.users where lower(email)='admin@admin.com'
on conflict(id) do update set role='manager',is_active=true;
