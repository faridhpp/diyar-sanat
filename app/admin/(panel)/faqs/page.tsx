import { FileTextIcon } from "@/components/admin-icons";
import { requireStaff } from "@/lib/admin/auth";
import { createClient } from "@/lib/db/server";
import { deleteFaq, saveFaq } from "../faq-actions";

type Props = { searchParams: Promise<Record<string, string | undefined>> };
type Faq = { id: number; category_fa: string; category_en: string; question_fa: string; question_en: string; answer_fa: string; answer_en: string; position: number; is_published: boolean };

export default async function FaqAdmin({ searchParams }: Props) {
  const [, query] = await Promise.all([requireStaff(), searchParams]);
  const { data = [] } = await (await createClient()).from("faq_items").select("*").order("position");
  const published = data?.filter(item => item.is_published).length ?? 0;
  const categories = new Set(data?.map(item => item.category_fa)).size;
  return <main className="admin-module-page admin-faq-page">
    <header><div><span><FileTextIcon /></span><div><small>مرکز راهنمای کاربران</small><h1>پرسش‌های متداول</h1><p>مدیریت پرسش‌ها، پاسخ‌های دوزبانه، دسته‌بندی و وضعیت انتشار</p></div></div></header>
    {query.saved ? <p className="admin-alert success" role="status">پرسش با موفقیت ذخیره شد.</p> : null}
    {query.deleted ? <p className="admin-alert success" role="status">پرسش حذف شد.</p> : null}
    {query.error ? <p className="admin-alert error" role="alert">عملیات انجام نشد؛ اطلاعات فرم را بررسی کنید.</p> : null}
    <section className="admin-faq-summary" aria-label="خلاصه پرسش‌های متداول"><article><small>کل پرسش‌ها</small><strong>{data?.length ?? 0}</strong></article><article><small>منتشرشده</small><strong>{published}</strong></article><article><small>دسته‌بندی‌ها</small><strong>{categories}</strong></article></section>
    <details className="admin-faq-create"><summary><span>+</span><div><strong>افزودن پرسش جدید</strong><small>پرسش و پاسخ فارسی و انگلیسی را هم‌زمان وارد کنید</small></div></summary><div><FaqForm /></div></details>
    <section className="admin-faq-list"><header><div><h2>پرسش‌های ثبت‌شده</h2><p>برای مشاهده و ویرایش هر پرسش، کارت آن را باز کنید.</p></div><span>{data?.length ?? 0}</span></header>
      <div className="admin-faq-items">{data?.map((row, index) => <details className="admin-faq-item" key={row.id}><summary><span className="admin-faq-order">{String(index + 1).padStart(2, "0")}</span><div><strong>{row.question_fa}</strong><small><b>{row.category_fa}</b><span dir="ltr">{row.question_en}</span></small></div><i className={row.is_published ? "published" : ""}>{row.is_published ? "منتشرشده" : "پیش‌نویس"}</i><em aria-hidden="true">+</em></summary><div className="admin-faq-editor"><FaqForm row={row} /></div></details>)}</div>
      {!data?.length ? <div className="admin-catalog-empty">هنوز پرسشی ثبت نشده است.</div> : null}
    </section>
  </main>;
}

function FaqForm({ row }: { row?: Faq }) {
  return <form action={saveFaq} className="admin-faq-form">{row ? <input type="hidden" name="id" value={row.id} /> : null}
    <fieldset><legend><b>FA</b> محتوای فارسی</legend><label><span>دسته‌بندی</span><input name="category_fa" required defaultValue={row?.category_fa} placeholder="مثلاً اصالت محصول" /></label><label className="wide"><span>پرسش</span><input name="question_fa" required defaultValue={row?.question_fa} /></label><label className="wide"><span>پاسخ کامل</span><textarea name="answer_fa" rows={5} required defaultValue={row?.answer_fa} /></label></fieldset>
    <fieldset dir="ltr"><legend><b>EN</b> English content</legend><label><span>Category</span><input name="category_en" required defaultValue={row?.category_en} placeholder="e.g. Product authenticity" /></label><label className="wide"><span>Question</span><input name="question_en" required defaultValue={row?.question_en} /></label><label className="wide"><span>Complete answer</span><textarea name="answer_en" rows={5} required defaultValue={row?.answer_en} /></label></fieldset>
    <footer><label><span>ترتیب نمایش</span><input name="position" type="number" min="0" defaultValue={row?.position ?? 0} /></label><label className="admin-switch-field"><input name="is_published" type="checkbox" defaultChecked={row?.is_published ?? true} /><span><b>انتشار در سایت</b><small>برای کاربران قابل مشاهده باشد</small></span></label><div className="admin-faq-actions">{row ? <button type="submit" formAction={deleteFaq} className="admin-danger-button">حذف پرسش</button> : null}<button type="submit" className="admin-primary-button">{row ? "ذخیره تغییرات" : "ثبت پرسش"}</button></div></footer>
  </form>;
}
