import { FileTextIcon, GlobeIcon } from "@/components/admin-icons";
import { requireStaff } from "@/lib/admin/auth";
import { createClient } from "@/lib/db/server";
import { saveTranslation } from "../content-settings-actions";
import { HomepageMediaAdmin } from "@/components/homepage-media-admin";

type Props = { searchParams: Promise<Record<string, string | undefined>> };
type Row = { namespace: string; translation_key: string; locale: "fa" | "en"; value: string; description: string | null };
type PageMeta = { label: string; description: string };

const pageMeta: Record<string, PageMeta> = {
  home: { label: "صفحه اصلی", description: "هیرو، محصولات، برندها، کارخانه، رسانه و گواهینامه‌ها" },
  about: { label: "درباره ما", description: "معرفی شرکت، داستان و چشم‌انداز" },
  contact: { label: "تماس با ما", description: "عنوان صفحه و اطلاعات دفتر" },
  faq: { label: "پرسش‌های متداول", description: "عنوان و توضیحات صفحه پرسش‌ها" },
  "buying-guide": { label: "راهنمای خرید", description: "عنوان و معرفی راهنمای انتخاب محصول" },
  international: { label: "همکاری بین‌المللی", description: "چشم‌انداز و معرفی همکاری‌های آینده" },
  "global-footer": { label: "فوتر سایت", description: "خبرنامه، اطلاعات تماس و عنوان ستون‌ها" },
};

const fieldLabels: Record<string, string> = {
  "hero.current": "عنوان مسیر صفحه", "hero.eyebrow": "عنوان کوچک", "hero.kicker": "پیش‌عنوان هیرو",
  "hero.title": "عنوان اصلی", "hero.subtitle": "زیرعنوان", "hero.description": "توضیحات هیرو",
  "hero.badge_title": "عنوان برچسب ساخت ایران", "hero.badge_subtitle": "متن دوم برچسب",
  "products.eyebrow": "پیش‌عنوان محصولات", "products.title": "عنوان محصولات",
  "brands.eyebrow": "پیش‌عنوان برندها", "brands.title": "عنوان برندها", "brands.description": "توضیحات برندها",
  "factory.eyebrow": "پیش‌عنوان کارخانه", "factory.title": "عنوان کارخانه", "factory.description": "معرفی کارخانه",
  "media.eyebrow": "پیش‌عنوان رسانه", "media.title": "عنوان رسانه", "media.description": "توضیحات رسانه",
  "certificates.title": "عنوان مجوزها", "certificates.description": "توضیحات مجوزها",
  "story.eyebrow": "پیش‌عنوان داستان", "story.title": "عنوان داستان", "story.description": "متن داستان",
  "vision.title": "عنوان چشم‌انداز", "vision.description": "متن چشم‌انداز",
  "office.title": "عنوان دفتر", "office.email": "ایمیل", "office.phone": "تلفن", "office.address": "نشانی",
  "newsletter.title": "عنوان خبرنامه", "newsletter.description": "توضیحات خبرنامه",
  "credentials.title": "عنوان نمادها و مجوزها", "contact.title": "عنوان اطلاعات تماس", "contact.location": "موقعیت", "contact.phone": "تلفن", "contact.email": "ایمیل",
  "customer_service.title": "عنوان خدمات مشتریان", "quick_links.title": "عنوان دسترسی سریع",
};

export default async function PageContent({ searchParams }: Props) {
  const [, query] = await Promise.all([requireStaff(), searchParams]);
  const { data } = await (await createClient()).from("site_translations").select("id,namespace,translation_key,locale,value,description").order("namespace").order("translation_key");
  const pages = new Map<string, Map<string, Row[]>>();
  for (const row of data ?? []) { const fields = pages.get(row.namespace) ?? new Map<string, Row[]>(); const values = fields.get(row.translation_key) ?? []; values.push(row); fields.set(row.translation_key, values); pages.set(row.namespace, fields); }
  const orderedPages = [...pages].sort(([a], [b]) => Object.keys(pageMeta).indexOf(a) - Object.keys(pageMeta).indexOf(b));

  return <main className="admin-module-page admin-content-page">
    <header><div><span><FileTextIcon /></span><div><small>مدیریت محتوای دوزبانه</small><h1>محتوای صفحات</h1><p>هر بخش را انتخاب کنید و نسخه فارسی و انگلیسی را کنار هم ویرایش کنید.</p></div></div></header>
    {query.saved ? <p className="admin-alert success" role="status">تغییرات با موفقیت ذخیره شد.</p> : null}
    {query.error ? <p className="admin-alert error" role="alert">ذخیره انجام نشد؛ فیلدهای ضروری را بررسی کنید.</p> : null}
    <HomepageMediaAdmin />
    <div className="admin-content-workspace">
      <aside className="admin-content-nav" aria-label="فهرست صفحات"><div className="admin-content-nav-title"><GlobeIcon /><div><strong>صفحات سایت</strong><small>{orderedPages.length} بخش قابل ویرایش</small></div></div><nav>{orderedPages.map(([namespace, fields]) => <a href={`#content-${namespace}`} key={namespace}><span>{pageMeta[namespace]?.label ?? namespace}</span><small>{fields.size} فیلد</small></a>)}</nav></aside>
      <div className="admin-content-sections">
        {orderedPages.map(([namespace, fields]) => <section id={`content-${namespace}`} className="admin-content-section" key={namespace}>
          <header><div><small dir="ltr">{namespace}</small><h2>{pageMeta[namespace]?.label ?? namespace}</h2><p>{pageMeta[namespace]?.description ?? "محتوای دوزبانه این بخش"}</p></div><span>{fields.size} فیلد</span></header>
          <div className="admin-content-fields">{[...fields].map(([key, rows]) => <ContentField key={key} rows={rows} />)}</div>
        </section>)}
        <details className="admin-content-advanced"><summary>افزودن فیلد جدید برای توسعه‌دهندگان</summary><div><p>برای حفظ ساختار صفحه فقط زمانی استفاده شود که کلید جدید در قالب سایت پشتیبانی شده باشد.</p><ContentForm /></div></details>
      </div>
    </div>
  </main>;
}

function ContentField({ rows }: { rows: Row[] }) {
  const first = rows[0];
  const label = fieldLabels[first.translation_key] ?? first.description ?? first.translation_key;
  return <article className="admin-content-field"><header><div><h3>{label}</h3><code dir="ltr">{first.translation_key}</code></div>{first.description ? <small>{first.description}</small> : null}</header><ContentForm rows={rows} /></article>;
}

function ContentForm({ rows = [] }: { rows?: Row[] }) {
  const first = rows[0];
  return <form action={saveTranslation} className="admin-content-form">
    {first ? <><input type="hidden" name="namespace" value={first.namespace} /><input type="hidden" name="translation_key" value={first.translation_key} /></> : <div className="admin-content-technical"><label><span>شناسه بخش</span><input name="namespace" dir="ltr" required /></label><label><span>کلید محتوا</span><input name="translation_key" dir="ltr" required /></label></div>}
    <div className="admin-content-languages"><label><span><b>FA</b> متن فارسی</span><textarea name="fa_value" required rows={4} defaultValue={rows.find(row => row.locale === "fa")?.value} /></label><label dir="ltr"><span><b>EN</b> English content</span><textarea name="en_value" required rows={4} defaultValue={rows.find(row => row.locale === "en")?.value} /></label></div>
    <input type="hidden" name="description" value={first?.description ?? ""} /><footer><small>تغییر پس از ذخیره در نسخه فارسی و انگلیسی سایت اعمال می‌شود.</small><button type="submit">ذخیره تغییرات</button></footer>
  </form>;
}
