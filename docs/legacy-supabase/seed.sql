insert into public.brands (code, is_published, position)
values ('diyar-shimi', true, 1)
on conflict (code) do update
set is_published = excluded.is_published,
    position = excluded.position;

insert into public.brand_translations (brand_id, locale, name, description, slug)
select id, seed.locale, seed.name, seed.description, seed.slug
from public.brands
cross join (values
  ('fa', 'دیار شیمی', 'برند محصولات روانکار و سیالات تخصصی خودرو', 'diyar-shimi'),
  ('en', 'Diyar Shimi', 'Automotive lubricants and specialty fluids', 'diyar-shimi')
) as seed(locale, name, description, slug)
where code = 'diyar-shimi'
on conflict (brand_id, locale) do update
set name = excluded.name,
    description = excluded.description,
    slug = excluded.slug;

insert into public.product_categories
  (brand_id, code, icon_key, accent_color, is_published, position)
select brands.id, seed.code, seed.icon_key, seed.accent_color, true, seed.position
from public.brands
cross join (values
  ('engine-oil', 'droplet', '#D12632', 1),
  ('gear-oil', 'gear', '#164B82', 2),
  ('brake-fluid', 'brake', '#C77A10', 3),
  ('antifreeze', 'snowflake', '#2877BD', 4)
) as seed(code, icon_key, accent_color, position)
where brands.code = 'diyar-shimi'
on conflict (code) do update
set icon_key = excluded.icon_key,
    accent_color = excluded.accent_color,
    is_published = excluded.is_published,
    position = excluded.position;

insert into public.product_category_translations
  (category_id, locale, name, description, slug, seo_title, seo_description)
select categories.id, seed.locale, seed.name, seed.description, seed.slug,
  seed.seo_title, seed.seo_description
from public.product_categories as categories
join (values
  ('engine-oil', 'fa', 'روغن موتور', 'روانکاری و محافظت از موتور در شرایط کاری متفاوت', 'engine-oil', 'روغن موتور دیار شیمی', 'معرفی روغن موتورهای دیار شیمی برای خودروهای سواری و دیزلی'),
  ('engine-oil', 'en', 'Engine oil', 'Lubrication and engine protection across operating conditions', 'engine-oil', 'Diyar Shimi engine oils', 'Explore Diyar Shimi engine oils for passenger and diesel vehicles'),
  ('gear-oil', 'fa', 'واسکازین', 'روانکاری پایدار چرخ‌دنده‌ها و سامانه انتقال قدرت', 'gear-oil', 'واسکازین دیار شیمی', 'محصولات روغن گیربکس و واسکازین دیار شیمی'),
  ('gear-oil', 'en', 'Gear oil', 'Stable lubrication for gears and transmission systems', 'gear-oil', 'Diyar Shimi gear oils', 'Diyar Shimi transmission and gear-oil products'),
  ('brake-fluid', 'fa', 'مایع روغن ترمز', 'انتقال مطمئن فشار و پایداری عملکرد سامانه ترمز', 'brake-fluid', 'مایع روغن ترمز دیار شیمی', 'مایع روغن ترمز دیار شیمی برای عملکرد پایدار سامانه ترمز'),
  ('brake-fluid', 'en', 'Brake fluid', 'Reliable pressure transfer and stable braking performance', 'brake-fluid', 'Diyar Shimi brake fluid', 'Diyar Shimi brake fluids for stable braking performance'),
  ('antifreeze', 'fa', 'ضدیخ و ضدجوش', 'محافظت از سامانه خنک‌کاری در برابر یخ‌زدگی، جوش و خوردگی', 'antifreeze', 'ضدیخ دیار شیمی', 'ضدیخ و ضدجوش دیار شیمی برای محافظت از سامانه خنک‌کاری'),
  ('antifreeze', 'en', 'Antifreeze and coolant', 'Cooling-system protection from freezing, boiling, and corrosion', 'antifreeze', 'Diyar Shimi antifreeze', 'Diyar Shimi antifreeze and coolant for cooling-system protection')
) as seed(code, locale, name, description, slug, seo_title, seo_description)
  on seed.code = categories.code
on conflict (category_id, locale) do update
set name = excluded.name,
    description = excluded.description,
    slug = excluded.slug,
    seo_title = excluded.seo_title,
    seo_description = excluded.seo_description;

insert into public.products
  (brand_id, category_id, sku, is_featured, is_published, position, published_at)
select brands.id, categories.id, seed.sku, true, true, seed.position, now()
from public.brands
join public.product_categories as categories on categories.brand_id = brands.id
join (values
  ('engine-oil', 'DST-EO-10W40', 1),
  ('engine-oil', 'DST-DEO-15W40', 2),
  ('brake-fluid', 'DST-BF-DOT4', 3),
  ('antifreeze', 'DST-AF-40', 4)
) as seed(category_code, sku, position) on seed.category_code = categories.code
where brands.code = 'diyar-shimi'
on conflict (sku) do update
set category_id = excluded.category_id,
    brand_id = excluded.brand_id,
    is_featured = excluded.is_featured,
    is_published = excluded.is_published,
    position = excluded.position,
    published_at = excluded.published_at;

insert into public.product_translations
  (product_id, locale, name, short_description, key_specification, slug, seo_title, seo_description)
select products.id, seed.locale, seed.name, seed.short_description,
  seed.key_specification, seed.slug, seed.seo_title, seed.seo_description
from public.products
join (values
  ('DST-EO-10W40', 'fa', 'روغن موتور پیشرفته', 'محافظت پایدار برای کارکرد روزمره موتور', '10W-40', 'advanced-engine-oil-10w40', 'روغن موتور 10W-40 دیار شیمی', 'معرفی روغن موتور 10W-40 دیار شیمی و کاربردهای آن'),
  ('DST-EO-10W40', 'en', 'Advanced engine oil', 'Stable protection for everyday engine operation', '10W-40', 'advanced-engine-oil-10w40', 'Diyar Shimi 10W-40 engine oil', 'Diyar Shimi 10W-40 engine oil overview and applications'),
  ('DST-DEO-15W40', 'fa', 'روغن موتور دیزل', 'روانکاری برای موتورهای دیزل در کاربری‌های مختلف', '15W-40', 'diesel-engine-oil-15w40', 'روغن موتور دیزل 15W-40 دیار شیمی', 'معرفی روغن موتور دیزل 15W-40 دیار شیمی'),
  ('DST-DEO-15W40', 'en', 'Diesel engine oil', 'Lubrication for diesel engines across different use cases', '15W-40', 'diesel-engine-oil-15w40', 'Diyar Shimi 15W-40 diesel engine oil', 'Diyar Shimi 15W-40 diesel engine oil overview'),
  ('DST-BF-DOT4', 'fa', 'مایع روغن ترمز', 'برای انتقال فشار در سامانه‌های ترمز سازگار', 'DOT 4', 'brake-fluid-dot4', 'مایع روغن ترمز DOT 4 دیار شیمی', 'معرفی مایع روغن ترمز DOT 4 دیار شیمی'),
  ('DST-BF-DOT4', 'en', 'Brake fluid', 'For pressure transfer in compatible braking systems', 'DOT 4', 'brake-fluid-dot4', 'Diyar Shimi DOT 4 brake fluid', 'Diyar Shimi DOT 4 brake fluid overview'),
  ('DST-AF-40', 'fa', 'ضدیخ و ضدجوش', 'محافظت از مدار خنک‌کاری در شرایط دمایی مختلف', '-40°C', 'antifreeze-coolant-40', 'ضدیخ منفی ۴۰ دیار شیمی', 'معرفی ضدیخ و ضدجوش منفی ۴۰ دیار شیمی'),
  ('DST-AF-40', 'en', 'Antifreeze and coolant', 'Cooling-circuit protection across temperature conditions', '-40°C', 'antifreeze-coolant-40', 'Diyar Shimi -40°C antifreeze', 'Diyar Shimi -40°C antifreeze and coolant overview')
) as seed(sku, locale, name, short_description, key_specification, slug, seo_title, seo_description)
  on seed.sku = products.sku
on conflict (product_id, locale) do update
set name = excluded.name,
    short_description = excluded.short_description,
    key_specification = excluded.key_specification,
    slug = excluded.slug,
    seo_title = excluded.seo_title,
    seo_description = excluded.seo_description;
