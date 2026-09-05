create table public.representative_applications (
  id bigint generated always as identity primary key,
  tracking_code text not null unique default upper(substr(replace(gen_random_uuid()::text,'-',''),1,12)),
  locale text not null check (locale in ('fa','en')),
  full_name text not null,
  identity_code text not null,
  mobile text not null check (mobile ~ '^\+?[0-9]{10,15}$'),
  email text,
  business_name text not null,
  business_type text not null,
  country_code text not null check (country_code in ('IR','IQ')),
  region text not null,
  city text not null,
  address text not null,
  experience text not null,
  distribution_area text not null,
  facilities text[] not null default '{}',
  document_path text,
  notes text,
  consent_at timestamptz not null,
  status text not null default 'new' check (status in ('new','reviewing','needs_information','approved','rejected','archived')),
  internal_note text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index representative_applications_status_created_idx on public.representative_applications(status,created_at desc);
create index representative_applications_mobile_idx on public.representative_applications(mobile);
create trigger representative_applications_set_updated_at before update on public.representative_applications for each row execute function private.set_updated_at();
alter table public.representative_applications enable row level security;
create policy representative_applications_public_insert on public.representative_applications for insert to anon,authenticated with check (status='new' and reviewed_by is null and reviewed_at is null and internal_note is null);
create policy representative_applications_staff_read on public.representative_applications for select to authenticated using ((select private.has_staff_role(array['manager','admin'])));
create policy representative_applications_staff_update on public.representative_applications for update to authenticated using ((select private.has_staff_role(array['manager','admin']))) with check ((select private.has_staff_role(array['manager','admin'])));
create policy representative_applications_staff_delete on public.representative_applications for delete to authenticated using ((select private.has_staff_role(array['manager'])));
grant insert on public.representative_applications to anon,authenticated;
grant select,update,delete on public.representative_applications to authenticated;
grant usage,select on sequence public.representative_applications_id_seq to anon,authenticated;
