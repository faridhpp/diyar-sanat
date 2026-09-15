import { FileTextIcon, GlobeIcon } from "@/components/admin-icons";
import { AdminUploadField } from "@/components/admin-upload-field";
import { requireStaff } from "@/lib/admin/auth";
import { createClient } from "@/lib/db/server";
import {
  saveContactMapEmbed,
  saveFooterTrustMarks,
  saveTranslation,
} from "../content-settings-actions";
import { HomepageMediaAdmin } from "@/components/homepage-media-admin";

type Props = { searchParams: Promise<Record<string, string | undefined>> };
type Row = {
  namespace: string;
  translation_key: string;
  locale: "fa" | "en";
  value: string;
  description: string | null;
};
type PageMeta = { label: string; description: string };

type FooterTrustValues = {
  mark1LabelFa: string;
  mark1LabelEn: string;
  mark1ImageUrl: string;
  mark1Html: string;
  mark2LabelFa: string;
  mark2LabelEn: string;
  mark2ImageUrl: string;
  mark2Html: string;
};

const pageMeta: Record<string, PageMeta> = {
  home: { label: "صفحه اصلی", description: "هیرو، محصولات، برندها، کارخانه، رسانه و گواهینامه‌ها" },
  about: { label: "درباره ما", description: "معرفی شرکت، داستان و چشم‌انداز" },
  contact: { label: "تماس با ما", description: "عنوان صفحه، اطلاعات دفتر و نقشه" },
  faq: { label: "پرسش‌های متداول", description: "عنوان و توضیحات صفحه پرسش‌ها" },
  "buying-guide": { label: "راهنمای خرید", description: "عنوان و معرفی راهنمای انتخاب محصول" },
  international: { label: "همکاری بین‌المللی", description: "چشم‌انداز و معرفی همکاری‌های آینده" },
  "global-footer": { label: "فوتر سایت", description: "خبرنامه، اطلاعات تماس، ستون‌ها و نمادهای اعتماد" },
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

const specialKeys = new Set([
  "contact:map.embed_url",
  "global-footer:credentials.mark1.label",
  "global-footer:credentials.mark1.image_url",
  "global-footer:credentials.mark1.html",
  "global-footer:credentials.mark2.label",
  "global-footer:credentials.mark2.image_url",
  "global-footer:credentials.mark2.html",
]);

export default async function PageContent({ searchParams }: Props) {
  const [, query] = await Promise.all([requireStaff(), searchParams]);
  const { data } = await (await createClient())
    .from("site_translations")
    .select("id,namespace,translation_key,locale,value,description")
    .order("namespace")
    .order("translation_key");

  const rows = (data ?? []) as Row[];
  const contentValue = (namespace: string, key: string, locale: "fa" | "en") =>
    rows.find(
      (row) => row.namespace === namespace && row.translation_key === key && row.locale === locale,
    )?.value ?? "";

  const footerTrustValues: FooterTrustValues = {
    mark1LabelFa: contentValue("global-footer", "credentials.mark1.label", "fa") || "ساخت ایران",
    mark1LabelEn: contentValue("global-footer", "credentials.mark1.label", "en") || "Made in Iran",
    mark1ImageUrl: contentValue("global-footer", "credentials.mark1.image_url", "fa"),
    mark1Html: contentValue("global-footer", "credentials.mark1.html", "fa"),
    mark2LabelFa: contentValue("global-footer", "credentials.mark2.label", "fa"),
    mark2LabelEn: contentValue("global-footer", "credentials.mark2.label", "en"),
    mark2ImageUrl: contentValue("global-footer", "credentials.mark2.image_url", "fa"),
    mark2Html: contentValue("global-footer", "credentials.mark2.html", "fa"),
  };
  const mapEmbed = contentValue("contact", "map.embed_url", "fa");

  const pages = new Map<string, Map<string, Row[]>>();
  for (const row of rows) {
    if (specialKeys.has(`${row.namespace}:${row.translation_key}`)) continue;
    const fields = pages.get(row.namespace) ?? new Map<string, Row[]>();
    const values = fields.get(row.translation_key) ?? [];
    values.push(row);
    fields.set(row.translation_key, values);
    pages.set(row.namespace, fields);
  }
  const orderedPages = [...pages].sort(
    ([a], [b]) => Object.keys(pageMeta).indexOf(a) - Object.keys(pageMeta).indexOf(b),
  );

  return (
    <main className="admin-module-page admin-content-page">
      <header>
        <div><span><FileTextIcon /></span><div><small>مدیریت محتوای دوزبانه</small><h1>محتوای صفحات</h1><p>هر بخش را انتخاب کنید و نسخه فارسی و انگلیسی را کنار هم ویرایش کنید.</p></div></div>
      </header>
      {query.saved ? <p className="admin-alert success" role="status">تغییرات با موفقیت ذخیره شد.</p> : null}
      {query.error ? <p className="admin-alert error" role="alert">ذخیره انجام نشد؛ فیلدهای ضروری یا کد Embed را بررسی کنید.</p> : null}
      <HomepageMediaAdmin />
      <div className="admin-content-workspace">
        <aside className="admin-content-nav" aria-label="فهرست صفحات">
          <div className="admin-content-nav-title"><GlobeIcon /><div><strong>صفحات سایت</strong><small>{orderedPages.length} بخش قابل ویرایش</small></div></div>
          <nav>{orderedPages.map(([namespace, fields]) => <a href={`#content-${namespace}`} key={namespace}><span>{pageMeta[namespace]?.label ?? namespace}</span><small>{fields.size} فیلد</small></a>)}</nav>
        </aside>
        <div className="admin-content-sections">
          {orderedPages.map(([namespace, fields]) => (
            <section id={`content-${namespace}`} className="admin-content-section" key={namespace}>
              <header><div><small dir="ltr">{namespace}</small><h2>{pageMeta[namespace]?.label ?? namespace}</h2><p>{pageMeta[namespace]?.description ?? "محتوای دوزبانه این بخش"}</p></div><span>{fields.size} فیلد</span></header>
              <div className="admin-content-fields">
                {[...fields].map(([key, values]) => <ContentField key={key} rows={values} />)}
                {namespace === "contact" ? <ContactMapEditor value={mapEmbed} /> : null}
                {namespace === "global-footer" ? <FooterTrustEditor values={footerTrustValues} /> : null}
              </div>
            </section>
          ))}
          <details className="admin-content-advanced"><summary>افزودن فیلد جدید برای توسعه‌دهندگان</summary><div><p>برای حفظ ساختار صفحه فقط زمانی استفاده شود که کلید جدید در قالب سایت پشتیبانی شده باشد.</p><ContentForm /></div></details>
        </div>
      </div>
    </main>
  );
}

function ContactMapEditor({ value }: { value: string }) {
  return (
    <article className="admin-content-field" style={{ gridColumn: "1 / -1" }}>
      <header><div><h3>نقشه صفحه تماس با ما</h3><code dir="ltr">map.embed_url</code></div><small>کد Embed گوگل مپ یا URL مستقیم Embed را وارد کنید.</small></header>
      <form action={saveContactMapEmbed} className="admin-content-form">
        <label>
          <span>کد Google Maps Embed</span>
          <textarea
            name="map_embed"
            rows={6}
            dir="ltr"
            defaultValue={value}
            placeholder={'<iframe src="https://www.google.com/maps/embed?..." ...></iframe>'}
          />
        </label>
        <footer><small>برای امنیت، فقط آدرس Embed معتبر Google Maps یا OpenStreetMap ذخیره می‌شود.</small><button type="submit">ذخیره نقشه</button></footer>
      </form>
    </article>
  );
}

function FooterTrustEditor({ values }: { values: FooterTrustValues }) {
  return (
    <article className="admin-content-field" style={{ gridColumn: "1 / -1" }}>
      <header><div><h3>نمادها و نشان‌های فوتر</h3><code dir="ltr">credentials.mark1 / credentials.mark2</code></div><small>برای هر جایگاه می‌توانید تصویر آپلود کنید یا کد HTML نمادهایی مثل اینماد را قرار دهید.</small></header>
      <form action={saveFooterTrustMarks} className="admin-content-form">
        <div className="admin-content-languages">
          <div>
            <h3>جایگاه اول</h3>
            <label><span>عنوان فارسی</span><input name="mark1_label_fa" defaultValue={values.mark1LabelFa} /></label>
            <label dir="ltr"><span>English label</span><input name="mark1_label_en" defaultValue={values.mark1LabelEn} /></label>
            <AdminUploadField name="mark1_image_url" label="تصویر جایگاه اول" folder="footer-credentials" accept="image/jpeg,image/png,image/webp" defaultValue={values.mark1ImageUrl} />
            <label><span>HTML نماد (اختیاری؛ در صورت وجود بر تصویر اولویت دارد)</span><textarea name="mark1_html" rows={6} dir="ltr" defaultValue={values.mark1Html} placeholder="کد لینک و تصویر اینماد یا نشان اعتماد" /></label>
          </div>
          <div>
            <h3>جایگاه دوم</h3>
            <label><span>عنوان فارسی</span><input name="mark2_label_fa" defaultValue={values.mark2LabelFa} /></label>
            <label dir="ltr"><span>English label</span><input name="mark2_label_en" defaultValue={values.mark2LabelEn} /></label>
            <AdminUploadField name="mark2_image_url" label="تصویر جایگاه دوم" folder="footer-credentials" accept="image/jpeg,image/png,image/webp" defaultValue={values.mark2ImageUrl} />
            <label><span>HTML نماد (اختیاری؛ در صورت وجود بر تصویر اولویت دارد)</span><textarea name="mark2_html" rows={6} dir="ltr" defaultValue={values.mark2Html} placeholder="کد لینک و تصویر نماد دوم" /></label>
          </div>
        </div>
        <footer><small>HTML هنگام نمایش محدود به لینک و تصویر امن می‌شود؛ اسکریپت و event handler اجرا نمی‌شود.</small><button type="submit">ذخیره نمادهای فوتر</button></footer>
      </form>
    </article>
  );
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
