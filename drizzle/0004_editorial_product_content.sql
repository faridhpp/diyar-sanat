-- Persist product-detail copy that was previously rendered from code so every
-- product-specific label/CTA is visible and editable in the product workspace.
with landing_copy(translation_key, fa, en, description) as (
  values
    ('hero.badge', 'ساخت ایران', 'Made in Iran', 'برچسب بالای صفحه محصول'),
    ('hero.brand_label', 'برند محصول', 'Product brand', 'عنوان کوچک برند در هیرو محصول'),
    ('origin.value', 'ایران', 'Iran', 'کشور سازنده محصول'),
    ('spec.category_label', 'گروه محصول', 'Category', 'برچسب گروه محصول'),
    ('spec.key_label', 'مشخصه کلیدی', 'Key specification', 'برچسب مشخصه کلیدی'),
    ('spec.brand_label', 'برند', 'Brand', 'برچسب برند در کارت مشخصات'),
    ('spec.origin_label', 'کشور سازنده', 'Country of origin', 'برچسب کشور سازنده'),
    ('cta.primary.label', 'استعلام و مشاوره خرید', 'Request pricing and advice', 'متن دکمه اصلی محصول'),
    ('cta.primary.href', '/contact', '/contact', 'لینک دکمه اصلی محصول'),
    ('cta.secondary.label', 'مشاهده همه محصولات', 'View all products', 'متن دکمه دوم محصول'),
    ('cta.secondary.href', '/products', '/products', 'لینک دکمه دوم محصول'),
    ('related.eyebrow', 'پیشنهادهای دیگر', 'More products', 'پیش‌عنوان محصولات مرتبط'),
    ('related.title', 'محصولات مرتبط', 'Related products', 'عنوان محصولات مرتبط')
)
insert into public.site_translations(namespace, translation_key, locale, value, description)
select 'product-' || p.id::text, c.translation_key, 'fa', c.fa, c.description
from public.products p
cross join landing_copy c
union all
select 'product-' || p.id::text, c.translation_key, 'en', c.en, c.description
from public.products p
cross join landing_copy c
on conflict(namespace, translation_key, locale) do nothing;

-- The product page previously invented these four benefits whenever a product
-- had no managed features. Move that visible content into the canonical product
-- feature table so editors can review, change, reorder, or delete it.
insert into public.product_features(
  product_id,
  icon_key,
  title_fa,
  title_en,
  description_fa,
  description_en,
  position
)
select
  p.id,
  defaults.icon_key,
  defaults.title_fa,
  defaults.title_en,
  null,
  null,
  defaults.position
from public.products p
cross join (
  values
    ('shield', 'رویکرد محافظتی', 'Protection focused', 0),
    ('droplet', 'عملکرد پایدار', 'Stable performance', 1),
    ('gear', 'کاربرد تخصصی', 'Specialist application', 2),
    ('snowflake', 'سبد خودرویی', 'Automotive portfolio', 3)
) as defaults(icon_key, title_fa, title_en, position)
where not exists (
  select 1
  from public.product_features existing
  where existing.product_id = p.id
);
