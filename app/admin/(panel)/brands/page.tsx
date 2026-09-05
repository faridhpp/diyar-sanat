import { requireStaff } from "@/lib/admin/auth";
import { createClient } from "@/lib/db/server";
import { deleteBrand, saveBrand } from "./actions";

type Props = { searchParams: Promise<{ error?: string; saved?: string; deleted?: string }> };

export default async function BrandsPage({ searchParams }: Props) {
  const [{ profile }, query] = await Promise.all([requireStaff(), searchParams]);
  const database = await createClient();
  const { data: brandRows = [] } = await database.from("brands").select("id,code,is_published,position").order("position");
  const { data: translationRows = [] } = brandRows?.length ? await database.from("brand_translations").select("brand_id,locale,name,slug,description").in("brand_id", brandRows.map(item => item.id)) : { data: [] };
  const brands: Brand[] = (brandRows ?? []).map(brand => ({ ...brand, brand_translations: (translationRows ?? []).filter(item => item.brand_id === brand.id) }));
  return <main className="admin-module-page admin-brands-page">
    <header><div><div><small>کاتالوگ</small><h1>برندها</h1><p>نام، ترجمه و وضعیت نمایش برندها</p></div></div></header>
    {query.error ? <p className="admin-alert error" role="alert">{query.error}</p> : null}
    {query.saved ? <p className="admin-alert success" role="status">برند ذخیره شد.</p> : null}
    {query.deleted ? <p className="admin-alert success" role="status">برند حذف شد.</p> : null}
    <section className="admin-brand-create">
      <header><h2>افزودن برند</h2></header>
      <BrandForm />
    </section>
    <section className="admin-brand-list">
      <header><h2>برندهای ثبت‌شده</h2><span>{brands?.length ?? 0}</span></header>
      {brands?.length ? brands.map((brand) => {
        const fa = brand.brand_translations.find(item => item.locale === "fa");
        const en = brand.brand_translations.find(item => item.locale === "en");
        return <details key={brand.id} className="admin-brand-row">
          <summary><span className="admin-brand-monogram">{brand.code.slice(0, 2).toUpperCase()}</span><div><strong>{fa?.name || brand.code}</strong><small dir="ltr">{en?.name || brand.code}</small></div><i className={brand.is_published ? "published" : ""}>{brand.is_published ? "منتشرشده" : "پیش‌نویس"}</i><b>ویرایش</b></summary>
          <BrandForm brand={brand} />
          {profile.role !== "seo" ? <form action={deleteBrand} className="admin-brand-delete"><input type="hidden" name="id" value={brand.id}/><button type="submit">حذف برند</button></form> : null}
        </details>;
      }) : <div className="admin-catalog-empty"><strong>هنوز برندی ثبت نشده است</strong></div>}
    </section>
  </main>;
}

type Brand = { id:number; code:string; position:number; is_published:boolean; brand_translations:{ locale:"fa"|"en"; name:string; slug:string; description:string|null }[] };
function BrandForm({ brand }: { brand?: Brand }) {
  const fa = brand?.brand_translations.find(item => item.locale === "fa");
  const en = brand?.brand_translations.find(item => item.locale === "en");
  return <form action={saveBrand} className="admin-catalog-form">
    {brand ? <input type="hidden" name="id" value={brand.id}/> : null}
    <label><span>کد برند</span><input name="code" dir="ltr" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" defaultValue={brand?.code}/></label>
    <label><span>ترتیب نمایش</span><input name="position" type="number" min="0" defaultValue={brand?.position ?? 0}/></label>
    <fieldset><legend>فارسی</legend><label><span>نام برند</span><input name="fa_name" required defaultValue={fa?.name}/></label><label><span>نشانی</span><input name="fa_slug" dir="ltr" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" defaultValue={fa?.slug}/></label><label className="wide"><span>توضیح کوتاه</span><textarea name="fa_description" rows={3} defaultValue={fa?.description ?? ""}/></label></fieldset>
    <fieldset dir="ltr"><legend>English</legend><label><span>Brand name</span><input name="en_name" required defaultValue={en?.name}/></label><label><span>Slug</span><input name="en_slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" defaultValue={en?.slug}/></label><label className="wide"><span>Short description</span><textarea name="en_description" rows={3} defaultValue={en?.description ?? ""}/></label></fieldset>
    <label className="admin-publish-check"><input type="checkbox" name="is_published" defaultChecked={brand?.is_published}/><span>نمایش در وب‌سایت</span></label>
    <button type="submit">{brand ? "ذخیره تغییرات" : "ثبت برند"}</button>
  </form>;
}
