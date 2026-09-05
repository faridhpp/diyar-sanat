-- Secure staff administration foundation. No user is created by this migration.

alter table public.profiles
  add column if not exists phone text,
  add column if not exists avatar_url text,
  add column if not exists is_active boolean not null default false,
  add column if not exists last_seen_at timestamptz;

alter table public.profiles drop constraint if exists profiles_role_check;
update public.profiles
set role = case role
  when 'admin' then 'manager'
  when 'editor' then 'admin'
  else 'seo'
end,
is_active = case when role in ('admin', 'editor') then true else false end;
alter table public.profiles
  alter column role set default 'seo',
  add constraint profiles_role_check check (role in ('manager', 'admin', 'seo')),
  add constraint profiles_phone_format check (phone is null or phone ~ '^\+?[0-9]{10,15}$');

create index if not exists profiles_active_role_idx
  on public.profiles (is_active, role);

drop function if exists private.has_editor_access() cascade;

create or replace function private.current_staff_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select role
  from public.profiles
  where id = (select auth.uid())
    and is_active
  limit 1;
$$;

create or replace function private.has_staff_role(allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select private.current_staff_role()) = any(allowed_roles), false);
$$;

revoke all on function private.current_staff_role() from public, anon;
revoke all on function private.has_staff_role(text[]) from public, anon;
grant execute on function private.current_staff_role() to authenticated;
grant execute on function private.has_staff_role(text[]) to authenticated;

drop policy if exists profiles_read_own on public.profiles;
drop policy if exists profiles_admin_manage on public.profiles;
create policy profiles_read_own
on public.profiles for select to authenticated
using (id = (select auth.uid()) or (select private.has_staff_role(array['manager'])));
create policy profiles_manager_insert
on public.profiles for insert to authenticated
with check ((select private.has_staff_role(array['manager'])));
create policy profiles_manager_update
on public.profiles for update to authenticated
using ((select private.has_staff_role(array['manager'])))
with check ((select private.has_staff_role(array['manager'])));
create policy profiles_manager_delete
on public.profiles for delete to authenticated
using ((select private.has_staff_role(array['manager'])) and id <> (select auth.uid()));

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'brands', 'brand_translations', 'product_categories',
    'product_category_translations', 'products', 'product_translations',
    'product_specifications'
  ]
  loop
    execute format(
      'create policy %I on public.%I for all to authenticated using ((select private.has_staff_role(array[''manager'',''admin'',''seo'']))) with check ((select private.has_staff_role(array[''manager'',''admin'',''seo''])))',
      table_name || '_staff_manage', table_name
    );
  end loop;
end $$;

create table public.admin_settings (
  id boolean primary key default true check (id),
  login_method text not null default 'password'
    check (login_method in ('password', 'sms', 'both')),
  sms_provider text
    check (sms_provider is null or sms_provider in ('kavenegar', 'sms_ir', 'ippanel')),
  sms_sender text,
  sms_template_key text,
  otp_ttl_seconds integer not null default 120 check (otp_ttl_seconds between 60 and 600),
  otp_resend_seconds integer not null default 60 check (otp_resend_seconds between 30 and 300),
  require_captcha boolean not null default true,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_settings_sms_configuration check (
    login_method = 'password' or (sms_provider is not null and sms_template_key is not null)
  )
);

insert into public.admin_settings (id) values (true) on conflict (id) do nothing;

create table public.staff_login_events (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users (id) on delete set null,
  identifier_hint text,
  event_type text not null check (event_type in ('password_success','password_failure','otp_requested','otp_success','otp_failure','signed_out','blocked')),
  provider text check (provider is null or provider in ('password','kavenegar','sms_ir','ippanel')),
  ip_hash text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index staff_login_events_user_created_idx on public.staff_login_events (user_id, created_at desc);
create index staff_login_events_created_idx on public.staff_login_events (created_at desc);

create trigger admin_settings_set_updated_at before update on public.admin_settings
for each row execute function private.set_updated_at();

alter table public.admin_settings enable row level security;
alter table public.staff_login_events enable row level security;

create policy admin_settings_public_read on public.admin_settings for select to anon, authenticated
using (true);
create policy admin_settings_manager_update on public.admin_settings for update to authenticated
using ((select private.has_staff_role(array['manager'])))
with check ((select private.has_staff_role(array['manager'])));
create policy login_events_manager_read on public.staff_login_events for select to authenticated
using ((select private.has_staff_role(array['manager'])));

revoke all on public.admin_settings, public.staff_login_events from anon, authenticated;
grant select on public.admin_settings to anon, authenticated;
grant update on public.admin_settings to authenticated;
grant select on public.staff_login_events to authenticated;
grant usage, select on sequence public.staff_login_events_id_seq to authenticated;

comment on table public.admin_settings is 'Non-secret staff authentication settings. Provider API secrets live only in server environment variables.';
comment on table public.staff_login_events is 'Security audit trail. Insertions must happen through trusted server code, never direct browser access.';
