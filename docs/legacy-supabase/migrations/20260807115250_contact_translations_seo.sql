create table public.contact_submissions (
  id bigint generated always as identity primary key,
  tracking_code text not null unique,
  locale text not null check (locale in ('fa', 'en')),
  full_name text not null,
  mobile text not null check (mobile ~ '^\+?[0-9]{10,15}$'),
  email text not null,
  subject text not null,
  destination text not null check (destination in ('sales','technical','hr','pr')),
  message text not null,
  attachment_path text,
  consent_at timestamptz not null,
  status text not null default 'new' check (status in ('new','reviewing','answered','archived')),
  internal_note text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index contact_submissions_status_created_idx on public.contact_submissions(status, created_at desc);

create table public.site_translations (
  id bigint generated always as identity primary key,
  namespace text not null check (namespace ~ '^[a-z0-9_-]+$'),
  translation_key text not null check (translation_key ~ '^[a-z0-9_.-]+$'),
  locale text not null check (locale in ('fa','en')),
  value text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(namespace, translation_key, locale)
);
create index site_translations_lookup_idx on public.site_translations(locale, namespace);

create table public.seo_settings (
  id bigint generated always as identity primary key,
  route text not null check (route ~ '^/[a-z0-9/_-]*$'),
  locale text not null check (locale in ('fa','en')),
  title text not null,
  description text not null,
  canonical_url text,
  robots_index boolean not null default true,
  robots_follow boolean not null default true,
  og_image_url text,
  structured_data jsonb not null default '{}'::jsonb check (jsonb_typeof(structured_data) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(route, locale)
);
create index seo_settings_locale_route_idx on public.seo_settings(locale, route);

create trigger contact_submissions_set_updated_at before update on public.contact_submissions for each row execute function private.set_updated_at();
create trigger site_translations_set_updated_at before update on public.site_translations for each row execute function private.set_updated_at();
create trigger seo_settings_set_updated_at before update on public.seo_settings for each row execute function private.set_updated_at();

alter table public.contact_submissions enable row level security;
alter table public.site_translations enable row level security;
alter table public.seo_settings enable row level security;

create policy contact_submissions_staff_read on public.contact_submissions for select to authenticated using ((select private.has_staff_role(array['manager','admin'])));
create policy contact_submissions_staff_update on public.contact_submissions for update to authenticated using ((select private.has_staff_role(array['manager','admin']))) with check ((select private.has_staff_role(array['manager','admin'])));
create policy translations_public_read on public.site_translations for select to anon, authenticated using (true);
create policy translations_staff_manage on public.site_translations for all to authenticated using ((select private.has_staff_role(array['manager','admin','seo']))) with check ((select private.has_staff_role(array['manager','admin','seo'])));
create policy seo_public_read on public.seo_settings for select to anon, authenticated using (true);
create policy seo_staff_manage on public.seo_settings for all to authenticated using ((select private.has_staff_role(array['manager','admin','seo']))) with check ((select private.has_staff_role(array['manager','admin','seo'])));

revoke all on public.contact_submissions, public.site_translations, public.seo_settings from anon, authenticated;
grant select, update on public.contact_submissions to authenticated;
grant select on public.site_translations, public.seo_settings to anon, authenticated;
grant insert, update, delete on public.site_translations, public.seo_settings to authenticated;
grant usage, select on sequence public.contact_submissions_id_seq, public.site_translations_id_seq, public.seo_settings_id_seq to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('contact-attachments','contact-attachments',false,10485760,array['application/pdf','image/jpeg','image/png','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
