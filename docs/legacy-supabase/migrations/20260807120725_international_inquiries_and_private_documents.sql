create table public.international_inquiries (
  id bigint generated always as identity primary key,
  tracking_code text not null unique,
  locale text not null check (locale in ('fa','en')),
  company_name text not null,
  country text not null,
  website text,
  business_field text not null,
  import_distribution_experience text not null,
  interested_products text not null,
  estimated_volume text,
  cooperation_type text not null check (cooperation_type in ('distribution','representation','contract_manufacturing','other')),
  company_profile_path text not null,
  consent_at timestamptz not null,
  status text not null default 'new' check (status in ('new','reviewing','needs_information','approved','rejected','archived')),
  internal_note text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index international_inquiries_status_created_idx on public.international_inquiries(status,created_at desc);
create trigger international_inquiries_set_updated_at before update on public.international_inquiries for each row execute function private.set_updated_at();
alter table public.international_inquiries enable row level security;
create policy international_inquiries_staff_read on public.international_inquiries for select to authenticated using ((select private.has_staff_role(array['manager','admin'])));
create policy international_inquiries_staff_update on public.international_inquiries for update to authenticated using ((select private.has_staff_role(array['manager','admin']))) with check ((select private.has_staff_role(array['manager','admin'])));
revoke all on public.international_inquiries from anon,authenticated;
grant select,update on public.international_inquiries to authenticated;
grant usage,select on sequence public.international_inquiries_id_seq to authenticated;

drop policy if exists representative_applications_public_insert on public.representative_applications;
revoke insert on public.representative_applications from anon,authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
('representative-documents','representative-documents',false,10485760,array['application/pdf','image/jpeg','image/png']),
('international-profiles','international-profiles',false,10485760,array['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
