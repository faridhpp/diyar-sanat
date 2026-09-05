create schema if not exists private;

revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  role text not null default 'viewer'
    check (role in ('admin', 'editor', 'viewer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.brands (
  id bigint generated always as identity primary key,
  code text not null unique,
  is_published boolean not null default false,
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint brands_code_format check (code ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table public.brand_translations (
  id bigint generated always as identity primary key,
  brand_id bigint not null references public.brands (id) on delete cascade,
  locale text not null check (locale in ('fa', 'en')),
  name text not null,
  description text,
  slug text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (brand_id, locale),
  unique (locale, slug),
  constraint brand_translations_slug_format
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table public.product_categories (
  id bigint generated always as identity primary key,
  brand_id bigint not null references public.brands (id) on delete restrict,
  code text not null unique,
  icon_key text not null,
  accent_color text not null default '#164B82',
  is_published boolean not null default false,
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_categories_code_format
    check (code ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint product_categories_accent_color_format
    check (accent_color ~ '^#[0-9A-Fa-f]{6}$')
);

create table public.product_category_translations (
  id bigint generated always as identity primary key,
  category_id bigint not null references public.product_categories (id) on delete cascade,
  locale text not null check (locale in ('fa', 'en')),
  name text not null,
  description text,
  slug text not null,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (category_id, locale),
  unique (locale, slug),
  constraint product_category_translations_slug_format
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table public.products (
  id bigint generated always as identity primary key,
  brand_id bigint not null references public.brands (id) on delete restrict,
  category_id bigint not null references public.product_categories (id) on delete restrict,
  sku text unique,
  image_url text,
  datasheet_url text,
  is_featured boolean not null default false,
  is_published boolean not null default false,
  position integer not null default 0 check (position >= 0),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_published_at_required
    check (not is_published or published_at is not null)
);

create table public.product_translations (
  id bigint generated always as identity primary key,
  product_id bigint not null references public.products (id) on delete cascade,
  locale text not null check (locale in ('fa', 'en')),
  name text not null,
  short_description text,
  description text,
  key_specification text,
  slug text not null,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, locale),
  unique (locale, slug),
  constraint product_translations_slug_format
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table public.product_specifications (
  id bigint generated always as identity primary key,
  product_id bigint not null references public.products (id) on delete cascade,
  locale text not null check (locale in ('fa', 'en')),
  label text not null,
  value text not null,
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index brand_translations_brand_id_idx
  on public.brand_translations (brand_id);
create index product_categories_brand_position_idx
  on public.product_categories (brand_id, position)
  where is_published;
create index product_category_translations_category_id_idx
  on public.product_category_translations (category_id);
create index products_brand_id_idx on public.products (brand_id);
create index products_category_position_idx
  on public.products (category_id, position)
  where is_published;
create index products_featured_position_idx
  on public.products (is_featured, position)
  where is_published;
create index product_translations_product_id_idx
  on public.product_translations (product_id);
create index product_specifications_product_locale_position_idx
  on public.product_specifications (product_id, locale, position);

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function private.has_editor_access()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role in ('admin', 'editor')
  );
$$;

revoke execute on function private.set_updated_at() from public, anon, authenticated;
revoke execute on function private.has_editor_access() from public, anon;
grant execute on function private.has_editor_access() to authenticated;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();
create trigger brands_set_updated_at
before update on public.brands
for each row execute function private.set_updated_at();
create trigger brand_translations_set_updated_at
before update on public.brand_translations
for each row execute function private.set_updated_at();
create trigger product_categories_set_updated_at
before update on public.product_categories
for each row execute function private.set_updated_at();
create trigger product_category_translations_set_updated_at
before update on public.product_category_translations
for each row execute function private.set_updated_at();
create trigger products_set_updated_at
before update on public.products
for each row execute function private.set_updated_at();
create trigger product_translations_set_updated_at
before update on public.product_translations
for each row execute function private.set_updated_at();
create trigger product_specifications_set_updated_at
before update on public.product_specifications
for each row execute function private.set_updated_at();

alter table public.profiles enable row level security;
alter table public.brands enable row level security;
alter table public.brand_translations enable row level security;
alter table public.product_categories enable row level security;
alter table public.product_category_translations enable row level security;
alter table public.products enable row level security;
alter table public.product_translations enable row level security;
alter table public.product_specifications enable row level security;

create policy profiles_read_own
on public.profiles for select to authenticated
using (id = (select auth.uid()) or (select private.has_editor_access()));

create policy profiles_admin_manage
on public.profiles for all to authenticated
using ((select private.has_editor_access()))
with check ((select private.has_editor_access()));

create policy brands_public_read
on public.brands for select to anon, authenticated
using (is_published);
create policy brands_editor_manage
on public.brands for all to authenticated
using ((select private.has_editor_access()))
with check ((select private.has_editor_access()));

create policy brand_translations_public_read
on public.brand_translations for select to anon, authenticated
using (exists (
  select 1 from public.brands
  where brands.id = brand_translations.brand_id and brands.is_published
));
create policy brand_translations_editor_manage
on public.brand_translations for all to authenticated
using ((select private.has_editor_access()))
with check ((select private.has_editor_access()));

create policy product_categories_public_read
on public.product_categories for select to anon, authenticated
using (
  is_published
  and exists (
    select 1 from public.brands
    where brands.id = product_categories.brand_id
      and brands.is_published
  )
);
create policy product_categories_editor_manage
on public.product_categories for all to authenticated
using ((select private.has_editor_access()))
with check ((select private.has_editor_access()));

create policy product_category_translations_public_read
on public.product_category_translations for select to anon, authenticated
using (exists (
  select 1 from public.product_categories
  where product_categories.id = product_category_translations.category_id
    and product_categories.is_published
));
create policy product_category_translations_editor_manage
on public.product_category_translations for all to authenticated
using ((select private.has_editor_access()))
with check ((select private.has_editor_access()));

create policy products_public_read
on public.products for select to anon, authenticated
using (
  is_published
  and published_at <= now()
  and exists (
    select 1 from public.brands
    where brands.id = products.brand_id
      and brands.is_published
  )
  and exists (
    select 1 from public.product_categories
    where product_categories.id = products.category_id
      and product_categories.is_published
  )
);
create policy products_editor_manage
on public.products for all to authenticated
using ((select private.has_editor_access()))
with check ((select private.has_editor_access()));

create policy product_translations_public_read
on public.product_translations for select to anon, authenticated
using (exists (
  select 1 from public.products
  where products.id = product_translations.product_id
    and products.is_published
    and products.published_at <= now()
));
create policy product_translations_editor_manage
on public.product_translations for all to authenticated
using ((select private.has_editor_access()))
with check ((select private.has_editor_access()));

create policy product_specifications_public_read
on public.product_specifications for select to anon, authenticated
using (exists (
  select 1 from public.products
  where products.id = product_specifications.product_id
    and products.is_published
    and products.published_at <= now()
));
create policy product_specifications_editor_manage
on public.product_specifications for all to authenticated
using ((select private.has_editor_access()))
with check ((select private.has_editor_access()));

grant usage on schema public to anon, authenticated;
grant select on public.brands,
  public.brand_translations,
  public.product_categories,
  public.product_category_translations,
  public.products,
  public.product_translations,
  public.product_specifications
to anon, authenticated;

grant select, insert, update, delete on public.profiles to authenticated;
grant insert, update, delete on public.brands,
  public.brand_translations,
  public.product_categories,
  public.product_category_translations,
  public.products,
  public.product_translations,
  public.product_specifications
to authenticated;

grant usage, select on all sequences in schema public to authenticated;
