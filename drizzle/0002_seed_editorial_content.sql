-- Seed the four editorial stories that previously existed only as in-code public fallbacks.
-- The migration is idempotent by the Persian public slug and updates the matching
-- editorial entry when it already exists.

do $$
declare v_entry_id bigint;
begin
  select entry_id into v_entry_id
  from public.editorial_translations
  where locale = 'fa' and slug = 'choosing-the-right-engine-oil'
  limit 1;

  if v_entry_id is null then
    insert into public.editorial_entries
      (kind, cover_image_url, is_featured, is_published, published_at, position)
    values
      ('guide', '/images/product-engine-oil-dst.jpg', true, true, '2026-08-06 09:00:00+03:30', 1)
    returning id into v_entry_id;
  else
    update public.editorial_entries
    set kind = 'guide', cover_image_url = '/images/product-engine-oil-dst.jpg',
        is_featured = true, is_published = true,
        published_at = coalesce(published_at, '2026-08-06 09:00:00+03:30'), position = 1
    where id = v_entry_id;
  end if;

  insert into public.editorial_translations
    (entry_id, locale, title, slug, excerpt, body_markdown)
  values
    (v_entry_id, 'fa', 'راهنمای انتخاب روغن موتور مناسب', 'choosing-the-right-engine-oil',
     'مروری کاربردی بر اطلاعاتی که پیش از انتخاب روغن موتور باید از دفترچه خودرو و برچسب محصول بررسی شوند.',
     E'انتخاب روغن موتور باید بر اساس توصیه سازنده خودرو، شرایط کارکرد و مشخصات فنی تأییدشده محصول انجام شود. یک عدد یا عبارت روی بسته‌بندی به‌تنهایی برای تصمیم‌گیری کافی نیست.\n\n## پیش از خرید چه چیزهایی را بررسی کنیم؟\n\nدفترچه خودرو مرجع اصلی انتخاب است. پس از آن باید گرید ویسکوزیته، سطح عملکرد موردنیاز و سازگاری محصول با نوع موتور بررسی شود.\n\n## جمع‌بندی\n\nدر صورت تردید، از مشاوره فنی استفاده کنید و از جایگزینی محصول صرفاً بر اساس شباهت ظاهری بسته‌بندی خودداری کنید.'),
    (v_entry_id, 'en', 'How to choose the right engine oil', 'choosing-the-right-engine-oil',
     'A practical look at the information to check in the vehicle manual and on approved product documentation.',
     E'Engine oil should be selected according to the vehicle manufacturer’s recommendation, operating conditions, and approved product specifications. A single package marking is not enough for a sound decision.\n\n## What to check before buying\n\nThe vehicle manual is the primary reference. Then review viscosity grade, required performance level, and engine compatibility.\n\n## Summary\n\nWhen uncertain, seek technical advice and avoid substitutions based only on similar packaging.')
  on conflict (entry_id, locale) do update set
    title = excluded.title,
    slug = excluded.slug,
    excerpt = excluded.excerpt,
    body_markdown = excluded.body_markdown;
end $$;

do $$
declare v_entry_id bigint;
begin
  select entry_id into v_entry_id
  from public.editorial_translations
  where locale = 'fa' and slug = 'why-standard-fluids-matter'
  limit 1;

  if v_entry_id is null then
    insert into public.editorial_entries
      (kind, cover_image_url, is_featured, is_published, published_at, position)
    values
      ('article', '/images/product-antifreeze-dst.jpg', false, true, '2026-08-04 09:00:00+03:30', 2)
    returning id into v_entry_id;
  else
    update public.editorial_entries
    set kind = 'article', cover_image_url = '/images/product-antifreeze-dst.jpg',
        is_published = true,
        published_at = coalesce(published_at, '2026-08-04 09:00:00+03:30'), position = 2
    where id = v_entry_id;
  end if;

  insert into public.editorial_translations
    (entry_id, locale, title, slug, excerpt, body_markdown)
  values
    (v_entry_id, 'fa', 'نقش سیالات استاندارد در نگهداری خودرو', 'why-standard-fluids-matter',
     'چرا انتخاب سیال سازگار و تعویض در بازه مناسب می‌تواند به عملکرد پایدار سامانه‌های خودرو کمک کند؟',
     E'سیالات خودرو بخشی از سامانه‌های مکانیکی و حرارتی هستند و انتخاب آن‌ها باید با مشخصات فنی وسیله نقلیه هماهنگ باشد.\n\n## سازگاری مهم‌تر از انتخاب عمومی\n\nضدیخ، روغن ترمز، روغن موتور و واسکازین کارکرد یکسانی ندارند. ترکیب یا جایگزینی بدون بررسی می‌تواند عملکرد سامانه را مختل کند.'),
    (v_entry_id, 'en', 'Why compatible fluids matter in vehicle care', 'why-standard-fluids-matter',
     'Why compatible fluids and appropriate service intervals support stable vehicle-system performance.',
     E'Automotive fluids work within mechanical and thermal systems and should match the vehicle’s technical requirements.\n\n## Compatibility comes first\n\nCoolant, brake fluid, engine oil, and gear oil perform different tasks. Mixing or substituting without verification can disrupt system performance.')
  on conflict (entry_id, locale) do update set
    title = excluded.title,
    slug = excluded.slug,
    excerpt = excluded.excerpt,
    body_markdown = excluded.body_markdown;
end $$;

do $$
declare v_entry_id bigint;
begin
  select entry_id into v_entry_id
  from public.editorial_translations
  where locale = 'fa' and slug = 'quality-control-process-overview'
  limit 1;

  if v_entry_id is null then
    insert into public.editorial_entries
      (kind, cover_image_url, is_featured, is_published, published_at, position)
    values
      ('guide', '/images/factory-teaser-cover.png', false, true, '2026-08-02 09:00:00+03:30', 3)
    returning id into v_entry_id;
  else
    update public.editorial_entries
    set kind = 'guide', cover_image_url = '/images/factory-teaser-cover.png',
        is_published = true,
        published_at = coalesce(published_at, '2026-08-02 09:00:00+03:30'), position = 3
    where id = v_entry_id;
  end if;

  insert into public.editorial_translations
    (entry_id, locale, title, slug, excerpt, body_markdown)
  values
    (v_entry_id, 'fa', 'آشنایی با رویکرد کنترل کیفیت', 'quality-control-process-overview',
     'نگاهی آموزشی به نقاط کنترل مواد، فرایند و محصول نهایی در یک چارچوب تولید منظم.',
     E'کنترل کیفیت یک آزمون منفرد در پایان تولید نیست؛ مجموعه‌ای از نقاط بررسی است که از دریافت مواد تا ثبت نتایج محصول ادامه پیدا می‌کند.\n\n## سه سطح اصلی کنترل\n\nجزئیات هر خط تولید به فرایند و محصول وابسته است، اما چارچوب عمومی را می‌توان در سه سطح مشاهده کرد.'),
    (v_entry_id, 'en', 'Understanding a quality-control approach', 'quality-control-process-overview',
     'An educational overview of material, process, and final-product control points.',
     E'Quality control is not a single end-of-line test. It is a sequence of checks from material receipt through final result documentation.\n\n## Three control levels\n\nDetails vary by production line and product, but the general framework has three levels.')
  on conflict (entry_id, locale) do update set
    title = excluded.title,
    slug = excluded.slug,
    excerpt = excluded.excerpt,
    body_markdown = excluded.body_markdown;
end $$;

do $$
declare v_entry_id bigint;
begin
  select entry_id into v_entry_id
  from public.editorial_translations
  where locale = 'fa' and slug = 'diyar-sanat-product-development-direction'
  limit 1;

  if v_entry_id is null then
    insert into public.editorial_entries
      (kind, cover_image_url, is_featured, is_published, published_at, position)
    values
      ('news', '/images/product-gear-oil-dst.jpg', false, true, '2026-08-01 09:00:00+03:30', 4)
    returning id into v_entry_id;
  else
    update public.editorial_entries
    set kind = 'news', cover_image_url = '/images/product-gear-oil-dst.jpg',
        is_published = true,
        published_at = coalesce(published_at, '2026-08-01 09:00:00+03:30'), position = 4
    where id = v_entry_id;
  end if;

  insert into public.editorial_translations
    (entry_id, locale, title, slug, excerpt, body_markdown)
  values
    (v_entry_id, 'fa', 'رویکرد دیار صنعت به توسعه سبد محصولات', 'diyar-sanat-product-development-direction',
     'معرفی جهت‌گیری مجموعه برای توسعه مرحله‌ای محصولات خودرویی و انتشار اطلاعات مستند.',
     E'دیار صنعت تبریز توسعه سبد محصولات خودرویی را با تمرکز بر نیاز کاربرد، مستندسازی فنی و ارائه اطلاعات روشن دنبال می‌کند.\n\n## انتشار مسئولانه اطلاعات\n\nمشخصات، استانداردها و ادعاهای عملکردی هر محصول پس از تأیید اسناد مربوط به همان محصول منتشر می‌شوند. این رویکرد از انتشار اطلاعات غیرقابل‌اتکا جلوگیری می‌کند.'),
    (v_entry_id, 'en', 'Diyar Sanat’s product-development direction', 'diyar-sanat-product-development-direction',
     'An overview of the company’s measured approach to automotive product development and documented communication.',
     E'Diyar Sanat Tabriz is developing its automotive portfolio around application needs, technical documentation, and clear product communication.\n\n## Responsible publication\n\nSpecifications, standards, and performance claims are published only after the relevant product documents are approved.')
  on conflict (entry_id, locale) do update set
    title = excluded.title,
    slug = excluded.slug,
    excerpt = excluded.excerpt,
    body_markdown = excluded.body_markdown;
end $$;
