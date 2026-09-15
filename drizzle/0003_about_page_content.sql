-- Seed the redesigned About page as fully managed bilingual content.
-- Existing About-page values are intentionally updated to the employer-approved copy
-- supplied for this redesign; subsequent edits continue through /admin/translations.
with copy(translation_key, fa, en, description) as (
  values
    ('hero.current', 'درباره ما', 'About us', 'عنوان مسیر صفحه درباره ما'),
    ('hero.eyebrow', 'از تبریز، از سال ۱۴۰۱', 'From Tabriz, since 1401 SH', 'پیش‌عنوان هیرو درباره ما'),
    ('hero.title', 'دیار صنعت تبریز', 'Diyar Sanat Tabriz', 'عنوان اصلی هیرو درباره ما'),
    ('hero.description', 'تولید روانکارها، ضدیخ، مایع ترمز و محصولات شیمیایی خودرو با تمرکز بر کیفیت، توسعه فنی و اعتماد مشتریان.', 'Automotive lubricants, antifreeze, brake fluid, and chemical products developed with a focus on quality, technical progress, and customer trust.', 'توضیح هیرو درباره ما'),
    ('hero.image_alt', 'نمای مجموعه صنعتی دیار صنعت تبریز', 'Diyar Sanat Tabriz industrial facility', 'متن جایگزین تصویر اصلی درباره ما'),

    ('facts.year.label', 'سال تأسیس', 'Established', 'برچسب سال تأسیس'),
    ('facts.year.value', '۱۴۰۱', '1401 SH', 'مقدار سال تأسیس'),
    ('facts.location.label', 'موقعیت کارخانه', 'Factory location', 'برچسب موقعیت کارخانه'),
    ('facts.location.value', 'تبریز، ایران', 'Tabriz, Iran', 'مقدار موقعیت کارخانه'),
    ('facts.focus.label', 'حوزه فعالیت', 'Core focus', 'برچسب حوزه فعالیت'),
    ('facts.focus.value', 'روانکارها و سیالات خودرو', 'Automotive lubricants & fluids', 'مقدار حوزه فعالیت'),

    ('story.eyebrow', 'درباره مجموعه', 'About the company', 'پیش‌عنوان معرفی شرکت'),
    ('story.title', 'تولید تخصصی با نگاه رو به توسعه', 'Specialist production with a development mindset', 'عنوان معرفی شرکت'),
    ('story.description', 'شرکت دیار صنعت تبریز در سال ۱۴۰۱ با هدف تولید انواع روانکارها، ضدیخ، مایع ترمز و سایر محصولات شیمیایی خودرو تأسیس شد. کارخانه ما در شهر تبریز، به‌عنوان یکی از قطب‌های صنعتی کشور، مستقر است و با بهره‌گیری از تجهیزات تولید، فناوری‌های روز و نیروی انسانی متخصص، فعالیت خود را در مسیر تولید محصولاتی باکیفیت و قابل رقابت آغاز کرده است.', 'Diyar Sanat Tabriz was established in 1401 SH to produce automotive lubricants, antifreeze, brake fluid, and other vehicle chemical products. Based in Tabriz, one of Iran''s major industrial hubs, the company combines production equipment, current technologies, and specialist expertise to develop reliable and competitive products.', 'پاراگراف اول معرفی شرکت'),
    ('story.paragraph2', 'ما در دیار صنعت بر این باوریم که کیفیت، نتیجه تعهد، تخصص و توجه به جزئیات است. به همین دلیل، از انتخاب مواد اولیه تا تولید، بسته‌بندی و کنترل نهایی محصولات، تمامی مراحل با دقت انجام می‌شود تا محصولی مطمئن، بادوام و شایسته اعتماد مصرف‌کنندگان به بازار عرضه شود.', 'At Diyar Sanat, we believe quality is built through commitment, expertise, and attention to detail. From raw-material selection to production, packaging, and final control, every stage is approached carefully so dependable products can reach customers with confidence.', 'پاراگراف دوم معرفی شرکت'),

    ('commitment.eyebrow', 'رویکرد تولید', 'Our production approach', 'پیش‌عنوان رویکرد تولید'),
    ('commitment.title', 'کیفیت از مواد اولیه تا محصول نهایی', 'Quality from raw materials to the final product', 'عنوان رویکرد تولید'),
    ('commitment.description', 'با توجه به رشد صنعت خودرو و نیاز روزافزون به روانکارها و محصولات شیمیایی استاندارد، تلاش می‌کنیم محصولاتی توسعه دهیم که به حفظ عملکرد مناسب خودرو، کاهش سایش و خوردگی قطعات و پایداری عملکرد در شرایط کاری مختلف کمک کنند.', 'As the automotive industry grows and demand for dependable lubricants and chemical products increases, we focus on products designed to support vehicle performance, reduce wear and corrosion, and remain dependable across different operating conditions.', 'توضیح رویکرد تولید'),
    ('process.materials', 'انتخاب مواد اولیه', 'Raw-material selection', 'مرحله انتخاب مواد اولیه'),
    ('process.production', 'فرآیند تولید', 'Production process', 'مرحله فرآیند تولید'),
    ('process.packaging', 'بسته‌بندی', 'Packaging', 'مرحله بسته‌بندی'),
    ('process.quality_control', 'کنترل نهایی', 'Final quality control', 'مرحله کنترل نهایی'),

    ('values.eyebrow', 'اصول ما', 'Our principles', 'پیش‌عنوان ارزش‌های شرکت'),
    ('values.title', 'سه اصل در مسیر رشد دیار صنعت', 'Three principles guiding Diyar Sanat', 'عنوان ارزش‌های شرکت'),
    ('values.description', 'کیفیت، نوآوری و رضایت مشتری سه اصل اساسی فعالیت ما هستند و تصمیم‌های توسعه‌ای مجموعه بر پایه همین سه محور شکل می‌گیرند.', 'Quality, innovation, and customer trust are the three principles that guide how we develop products, processes, and long-term relationships.', 'توضیح ارزش‌های شرکت'),
    ('value.quality.title', 'کیفیت', 'Quality', 'عنوان ارزش کیفیت'),
    ('value.quality.description', 'کیفیت برای ما نتیجه تعهد، تخصص و توجه مستمر به جزئیات در تمام مراحل کار است.', 'For us, quality is the result of commitment, expertise, and consistent attention to detail throughout every stage.', 'توضیح ارزش کیفیت'),
    ('value.innovation.title', 'نوآوری', 'Innovation', 'عنوان ارزش نوآوری'),
    ('value.innovation.description', 'به‌روزرسانی دانش فنی و بهبود فرآیندها را بخشی از مسیر توسعه پایدار محصولات می‌دانیم.', 'We treat technical development and continuous process improvement as essential parts of sustainable product growth.', 'توضیح ارزش نوآوری'),
    ('value.customer.title', 'رضایت مشتری', 'Customer trust', 'عنوان ارزش رضایت مشتری'),
    ('value.customer.description', 'اعتماد مشتریان را سرمایه‌ای ارزشمند می‌دانیم و برای حفظ آن بر محصول، خدمات و پشتیبانی قابل اعتماد تمرکز می‌کنیم.', 'We consider customer trust a valuable asset and protect it through dependable products, service, and support.', 'توضیح ارزش رضایت مشتری'),

    ('vision.eyebrow', 'چشم‌انداز', 'Vision', 'پیش‌عنوان چشم‌انداز'),
    ('vision.title', 'توسعه یک برند خوش‌نام در صنعت روانکار و محصولات شیمیایی خودرو', 'Building a trusted name in automotive lubricants and chemical products', 'عنوان چشم‌انداز'),
    ('vision.description', 'چشم‌انداز ما در دیار صنعت، توسعه جایگاه برندهای مجموعه در بازار ایران و حرکت مرحله‌به‌مرحله به سوی بازارهای منطقه‌ای و بین‌المللی است. برای تحقق این هدف بر توسعه ظرفیت تولید، ارتقای کیفیت، نوآوری و ایجاد همکاری‌های پایدار تمرکز می‌کنیم.', 'Our vision is to strengthen the position of Diyar Sanat brands in Iran and move step by step toward regional and international markets. We focus on production development, quality improvement, innovation, and sustainable partnerships as the foundations of that journey.', 'متن چشم‌انداز'),
    ('vision.tagline', 'دیار صنعت؛ کیفیتی برای اعتماد، عملکردی برای اطمینان', 'Diyar Sanat — quality to trust, performance to rely on', 'شعار پایانی صفحه درباره ما')
)
insert into public.site_translations(namespace, translation_key, locale, value, description)
select 'about', translation_key, 'fa', fa, description from copy
union all
select 'about', translation_key, 'en', en, description from copy
on conflict(namespace, translation_key, locale)
do update set
  value = excluded.value,
  description = excluded.description;
