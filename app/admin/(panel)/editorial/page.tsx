import Link from "next/link";
import { AdminUploadField } from "@/components/admin-upload-field";
import { RichMarkdownEditor } from "@/components/rich-markdown-editor";
import { requireStaff } from "@/lib/admin/auth";
import { createClient } from "@/lib/db/server";
import { deleteEditorial, saveEditorial, saveMediaCategory } from "./actions";

type Props = {
  searchParams: Promise<{ error?: string; saved?: string; deleted?: string; edit?: string }>;
};

type Translation = {
  entry_id: number;
  locale: "fa" | "en";
  title: string;
  slug: string;
  excerpt: string | null;
  body_markdown: string;
  cta_label: string | null;
  seo_title: string | null;
  seo_description: string | null;
};

type Entry = {
  id: number;
  category_id: number | null;
  kind: "news" | "article" | "guide";
  cover_image_url: string | null;
  video_url: string | null;
  cta_url: string | null;
  is_featured: boolean;
  is_published: boolean;
  position: number;
};

type Category = { id: number; name_fa: string; name_en: string; is_published: boolean };

export default async function EditorialPage({ searchParams }: Props) {
  const [{ profile }, query] = await Promise.all([requireStaff(), searchParams]);
  const db = await createClient();
  const [categoryResult, entryResult, translationResult] = await Promise.all([
    db.from("media_categories").select("id,name_fa,name_en,is_published").order("position"),
    db.from("editorial_entries").select("id,category_id,kind,cover_image_url,video_url,cta_url,is_featured,is_published,position").order("created_at", { ascending: false }),
    db.from("editorial_translations").select("entry_id,locale,title,slug,excerpt,body_markdown,cta_label,seo_title,seo_description"),
  ]);

  const categories = (categoryResult.data ?? []) as Category[];
  const entries = (entryResult.data ?? []) as Entry[];
  const translations = (translationResult.data ?? []) as Translation[];
  const selected = entries.find((item) => item.id === Number(query.edit));

  return (
    <main className="admin-module-page">
      <header>
        <div><div><small>رسانه</small><h1>اخبار و مقالات</h1><p>مدیریت خبر، مقاله و آموزش با تصویر، ویدیو و محتوای ساختاریافته</p></div></div>
      </header>
      {query.error ? <p className="admin-alert error">{query.error}</p> : null}
      {query.saved ? <p className="admin-alert success">اطلاعات ذخیره شد.</p> : null}
      {query.deleted ? <p className="admin-alert success">محتوا حذف شد.</p> : null}

      <section className="admin-editorial-grid">
        <article>
          <h2>دسته رسانه</h2>
          <form action={saveMediaCategory} className="admin-location-form">
            <input name="name_fa" required placeholder="نام فارسی" />
            <input name="name_en" required dir="ltr" placeholder="English name" />
            <input name="code" required dir="ltr" placeholder="technical-guides" />
            <input name="slug_fa" required dir="ltr" placeholder="technical-guides" />
            <input name="slug_en" required dir="ltr" placeholder="technical-guides" />
            <input name="position" type="number" min="0" defaultValue="0" />
            <label><input name="is_published" type="checkbox" /><span>انتشار</span></label>
            <button>ثبت دسته</button>
          </form>
        </article>

        <article>
          <h2>{selected ? "ویرایش محتوا" : "محتوای جدید"}</h2>
          {selected ? <Link href="/admin/editorial">انصراف از ویرایش</Link> : null}
          <EditorialForm categories={categories} item={selected} translations={translations} />
        </article>
      </section>

      <section className="admin-card-section">
        <header><div><small>آرشیو رسانه</small><h2>اخبار، مقالات و آموزش‌ها</h2></div><span>{entries.length}</span></header>
        <div className="admin-entity-grid">
          {entries.map((item) => {
            const fa = translations.find((translation) => translation.entry_id === item.id && translation.locale === "fa");
            const en = translations.find((translation) => translation.entry_id === item.id && translation.locale === "en");
            return (
              <article className="admin-entity-card" key={item.id}>
                <div className="admin-entity-media">
                  {item.cover_image_url ? <img src={item.cover_image_url} alt={fa?.title ?? ""} /> : <span>✦</span>}
                  <i className={item.is_published ? "published" : ""}>{item.is_published ? "منتشرشده" : "پیش‌نویس"}</i>
                </div>
                <div className="admin-entity-body">
                  <small>{item.kind === "news" ? "خبر" : item.kind === "guide" ? "آموزش" : "مقاله"}</small>
                  <h3>{fa?.title ?? `محتوا ${item.id}`}</h3>
                  <p dir="ltr">{en?.title ?? "—"}</p>
                </div>
                <div className="admin-entity-actions">
                  <Link className="admin-edit-link" href={`/admin/editorial?edit=${item.id}`}>ویرایش</Link>
                  {profile.role !== "seo" ? (
                    <form action={deleteEditorial}>
                      <input type="hidden" name="id" value={item.id} />
                      <button className="danger">حذف</button>
                    </form>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}

function EditorialForm({ categories, item, translations }: { categories: Category[]; item?: Entry; translations: Translation[] }) {
  return (
    <form action={saveEditorial} className="admin-catalog-form admin-editorial-form">
      {item ? <input type="hidden" name="id" value={item.id} /> : null}
      <label>
        <span>نوع محتوا</span>
        <select name="kind" defaultValue={item?.kind ?? "article"}>
          <option value="news">خبر</option>
          <option value="article">مقاله</option>
          <option value="guide">آموزش</option>
        </select>
      </label>
      <label>
        <span>دسته</span>
        <select name="category_id" defaultValue={item?.category_id ?? ""}>
          <option value="">بدون دسته</option>
          {categories.map((category) => <option value={category.id} key={category.id}>{category.name_fa}</option>)}
        </select>
      </label>

      <AdminUploadField
        name="cover_image_url"
        label="تصویر شاخص"
        folder="editorial/covers"
        accept="image/jpeg,image/png,image/webp,image/avif"
        defaultValue={item?.cover_image_url ?? ""}
      />
      <AdminUploadField
        name="video_url"
        label="ویدیوی مقاله (اختیاری)"
        folder="editorial/videos"
        accept="video/mp4,video/webm"
        defaultValue={item?.video_url ?? ""}
      />

      <Locale locale="fa" value={translations.find((translation) => translation.entry_id === item?.id && translation.locale === "fa")} />
      <Locale locale="en" value={translations.find((translation) => translation.entry_id === item?.id && translation.locale === "en")} />

      <label><span>لینک فراخوان</span><input name="cta_url" dir="ltr" defaultValue={item?.cta_url ?? ""} placeholder="/contact" /></label>
      <label><span>ترتیب</span><input name="position" type="number" min="0" defaultValue={item?.position ?? 0} /></label>
      <div className="admin-product-checks">
        <label><input type="checkbox" name="is_featured" defaultChecked={item?.is_featured} /><span>ویژه</span></label>
        <label><input type="checkbox" name="is_published" defaultChecked={item?.is_published} /><span>انتشار</span></label>
      </div>
      <button>{item ? "ذخیره تغییرات" : "ثبت محتوا"}</button>
    </form>
  );
}

function Locale({ locale, value }: { locale: "fa" | "en"; value?: Translation }) {
  const fa = locale === "fa";
  return (
    <fieldset dir={fa ? "rtl" : "ltr"}>
      <legend>{fa ? "فارسی" : "English"}</legend>
      <label><span>{fa ? "عنوان" : "Title"}</span><input name={`${locale}_title`} required defaultValue={value?.title} /></label>
      <label><span>Slug</span><input name={`${locale}_slug`} dir="ltr" required defaultValue={value?.slug} /></label>
      <label className="wide"><span>{fa ? "خلاصه" : "Excerpt"}</span><textarea name={`${locale}_excerpt`} rows={3} defaultValue={value?.excerpt ?? ""} /></label>
      <div className="wide">
        <span style={{ display: "block", marginBottom: 7, fontSize: 10, fontWeight: 800 }}>{fa ? "متن محتوا" : "Content"}</span>
        <RichMarkdownEditor name={`${locale}_body`} defaultValue={value?.body_markdown ?? ""} locale={locale} />
      </div>
      <label><span>{fa ? "عنوان سئو" : "SEO title"}</span><input name={`${locale}_seo_title`} defaultValue={value?.seo_title ?? ""} /></label>
      <label><span>{fa ? "توضیحات سئو" : "SEO description"}</span><input name={`${locale}_seo_description`} defaultValue={value?.seo_description ?? ""} /></label>
      <label><span>{fa ? "متن دکمه" : "CTA label"}</span><input name={`${locale}_cta_label`} defaultValue={value?.cta_label ?? ""} /></label>
    </fieldset>
  );
}
