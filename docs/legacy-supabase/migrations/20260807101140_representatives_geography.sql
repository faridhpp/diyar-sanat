create table public.countries (
  id bigint generated always as identity primary key,
  code text not null unique check (code ~ '^[A-Z]{2}$'),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name_fa text not null,
  name_en text not null,
  is_published boolean not null default false,
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.provinces (
  id bigint generated always as identity primary key,
  country_id bigint not null references public.countries(id) on delete restrict,
  code text not null,
  slug text not null,
  name_fa text not null,
  name_en text not null,
  map_anchor_x numeric(6,3) check (map_anchor_x between 0 and 100),
  map_anchor_y numeric(6,3) check (map_anchor_y between 0 and 100),
  is_published boolean not null default false,
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(country_id,code), unique(country_id,slug)
);
create table public.cities (
  id bigint generated always as identity primary key,
  province_id bigint not null references public.provinces(id) on delete restrict,
  slug text not null,
  name_fa text not null,
  name_en text not null,
  is_published boolean not null default false,
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(province_id,slug)
);
create table public.representatives (
  id bigint generated always as identity primary key,
  city_id bigint not null references public.cities(id) on delete restrict,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  business_name_fa text not null, business_name_en text,
  manager_name_fa text not null, manager_name_en text,
  address_fa text not null, address_en text,
  phone text not null check (phone ~ '^\+?[0-9]{10,15}$'),
  whatsapp text check (whatsapp is null or whatsapp ~ '^\+?[0-9]{10,15}$'),
  latitude numeric(9,6) check (latitude between -90 and 90),
  longitude numeric(9,6) check (longitude between -180 and 180),
  directions_url text check (directions_url is null or directions_url ~ '^https://'),
  is_published boolean not null default false,
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index provinces_country_position_idx on public.provinces(country_id,position);
create index cities_province_position_idx on public.cities(province_id,position);
create index representatives_city_position_idx on public.representatives(city_id,position);
create index representatives_public_idx on public.representatives(city_id) where is_published;
create trigger countries_set_updated_at before update on public.countries for each row execute function private.set_updated_at();
create trigger provinces_set_updated_at before update on public.provinces for each row execute function private.set_updated_at();
create trigger cities_set_updated_at before update on public.cities for each row execute function private.set_updated_at();
create trigger representatives_set_updated_at before update on public.representatives for each row execute function private.set_updated_at();
alter table public.countries enable row level security; alter table public.provinces enable row level security; alter table public.cities enable row level security; alter table public.representatives enable row level security;
create policy countries_public_read on public.countries for select to anon,authenticated using (is_published);
create policy provinces_public_read on public.provinces for select to anon,authenticated using (is_published and exists(select 1 from public.countries c where c.id=country_id and c.is_published));
create policy cities_public_read on public.cities for select to anon,authenticated using (is_published and exists(select 1 from public.provinces p join public.countries c on c.id=p.country_id where p.id=province_id and p.is_published and c.is_published));
create policy representatives_public_read on public.representatives for select to anon,authenticated using (is_published and exists(select 1 from public.cities ci join public.provinces p on p.id=ci.province_id join public.countries c on c.id=p.country_id where ci.id=city_id and ci.is_published and p.is_published and c.is_published));
create policy countries_staff_manage on public.countries for all to authenticated using ((select private.has_staff_role(array['manager','admin']))) with check ((select private.has_staff_role(array['manager','admin'])));
create policy provinces_staff_manage on public.provinces for all to authenticated using ((select private.has_staff_role(array['manager','admin']))) with check ((select private.has_staff_role(array['manager','admin'])));
create policy cities_staff_manage on public.cities for all to authenticated using ((select private.has_staff_role(array['manager','admin']))) with check ((select private.has_staff_role(array['manager','admin'])));
create policy representatives_staff_manage on public.representatives for all to authenticated using ((select private.has_staff_role(array['manager','admin']))) with check ((select private.has_staff_role(array['manager','admin'])));
grant select on public.countries,public.provinces,public.cities,public.representatives to anon,authenticated;
grant insert,update,delete on public.countries,public.provinces,public.cities,public.representatives to authenticated;
grant usage,select on all sequences in schema public to authenticated;
insert into public.countries(code,slug,name_fa,name_en,is_published,position) values ('IR','iran','ایران','Iran',true,0),('IQ','iraq','عراق','Iraq',true,1);
