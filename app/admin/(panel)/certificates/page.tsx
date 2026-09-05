import { AdminUploadField } from "@/components/admin-upload-field";
import { requireStaff } from "@/lib/admin/auth";
import { createClient } from "@/lib/db/server";
import { createCertificate, deleteCertificate } from "../library-actions";

type Certificate = { id: number; code: string; title_fa: string; title_en: string; issuer_fa: string | null; issuer_en: string | null; certificate_number: string; document_url: string | null; image_url: string | null; position: number; is_published: boolean };

export default async function CertificatesPage() {
  const { profile } = await requireStaff();
  const { data: rows } = await (await createClient()).from("certificates").select("id,code,title_fa,title_en,issuer_fa,issuer_en,certificate_number,document_url,image_url,position,is_published").order("position");
  const data = rows ?? [];
  return <main className="admin-module-page">
    <header><div><div><small>اعتبارنامه‌ها</small><h1>گواهینامه‌ها</h1><p>استانداردها و مجوزهای مجموعه</p></div></div></header>
    <section className="admin-brand-create"><header><h2>افزودن گواهینامه</h2></header><CertificateForm /></section>
    <section className="admin-card-section"><header><div><small>آرشیو اعتبارنامه‌ها</small><h2>گواهینامه‌های ثبت‌شده</h2></div><span>{data.length}</span></header>
      <div className="admin-entity-grid">{data.map(item => <CertificateCard key={item.id} item={item} canDelete={profile.role !== "seo"} />)}</div>
    </section>
  </main>;
}

function CertificateCard({ item, canDelete }: { item: Certificate; canDelete: boolean }) {
  return <article className="admin-entity-card admin-certificate-card">
    <div className="admin-entity-media">{item.image_url ? <img src={item.image_url} alt={item.title_fa} /> : <span aria-hidden="true">✓</span>}<i className={item.is_published ? "published" : ""}>{item.is_published ? "منتشرشده" : "پیش‌نویس"}</i></div>
    <div className="admin-entity-body"><small dir="ltr">{item.code}</small><h3>{item.title_fa}</h3><p dir="ltr">{item.title_en}</p><strong dir="ltr">{item.certificate_number}</strong></div>
    <div className="admin-entity-actions"><details className="admin-card-editor"><summary>ویرایش</summary><div className="admin-card-editor-panel"><CertificateForm item={item} /></div></details>{canDelete ? <form action={deleteCertificate}><input type="hidden" name="id" value={item.id} /><button className="danger">حذف</button></form> : null}</div>
  </article>;
}

function CertificateForm({ item }: { item?: Certificate }) {
  return <form action={createCertificate} className="admin-catalog-form">{item ? <input type="hidden" name="id" value={item.id} /> : null}
    <label><span>کد داخلی</span><input name="code" dir="ltr" required defaultValue={item?.code} /></label><label><span>شماره گواهی</span><input name="certificate_number" dir="ltr" required defaultValue={item?.certificate_number} /></label>
    <label><span>عنوان فارسی</span><input name="title_fa" required defaultValue={item?.title_fa} /></label><label><span>عنوان انگلیسی</span><input name="title_en" dir="ltr" required defaultValue={item?.title_en} /></label>
    <label><span>صادرکننده فارسی</span><input name="issuer_fa" defaultValue={item?.issuer_fa ?? ""} /></label><label><span>Issuer</span><input name="issuer_en" dir="ltr" defaultValue={item?.issuer_en ?? ""} /></label>
    <AdminUploadField name="image_url" label="تصویر گواهی" folder="certificates" accept="image/jpeg,image/png,image/webp" defaultValue={item?.image_url ?? ""} /><AdminUploadField name="document_url" label="فایل گواهی" folder="certificates" accept="application/pdf" defaultValue={item?.document_url ?? ""} />
    <label><span>ترتیب</span><input name="position" type="number" min="0" defaultValue={item?.position ?? 0} /></label><label className="admin-publish-check"><input name="is_published" type="checkbox" defaultChecked={item?.is_published} /><span>انتشار</span></label><button>{item ? "ذخیره تغییرات" : "ثبت گواهینامه"}</button>
  </form>;
}
