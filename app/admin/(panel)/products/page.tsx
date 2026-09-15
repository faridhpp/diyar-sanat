import { AdminUploadField } from "@/components/admin-upload-field";
import { ProductAdvancedEditor } from "@/components/product-advanced-editor";
import { ProductLandingEditor } from "@/components/product-landing-editor";
import { requireStaff } from "@/lib/admin/auth";
import { createClient } from "@/lib/db/server";
import { deleteProduct, saveProduct } from "./actions";

type Props = { searchParams: Promise<{ error?: string; saved?: string; deleted?: string }> };
type Option = { id: number; brand_id?: number; name: string };
type Translation = {
  locale: "fa" | "en";
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  key_specification: string | null;
  seo_title: string | null;
  seo_description: string | null;
};
type Spec = { locale: "fa" | "en"; label: string; value: string; position: number };
type LandingRow = { namespace: string; translation_key: string; locale: "fa" | "en"; value: string };
type Product = {
  id: number;
  brand_id: number;
  category_id: number;
  sku: string | null;
  image_url: string | null;
  datasheet_url: string | null;
  is_featured: boolean;
  is_published: boolean;
  position: number;
  translations: Translation[];
  specs: Spec[];
};

export default async function ProductsPage({ searchParams }: Props) {
  const [{ profile }, query] = await Promise.all([requireStaff(), searchParams]);
  const database = await createClient();
  const [
    { data: brandRows = [] },
    { data: brandNames = [] },
    { data: categoryRows = [] },
    { data: categoryNames = [] },
    { data: productRows = [] },
    { data: landingRows = [] },
  ] = await Promise.all([
    database.from("brands").select("id"),
    database.from("brand_translations").select("brand_id,name").eq("locale", "fa"),
    database.from("product_categories").select("id,brand_id").order("position"),
    database.from("product_category_translations").select("category_id,name").eq("locale", "fa"),
    database.from("products").select("id,brand_id,category_id,sku,image_url,datasheet_url,is_featured,is_published,position").order("position"),
    database.from("site_translations").select("namespace,translation_key,locale,value"),
  ]);

  const ids = (productRows ?? []).map((item) => item.id);
  const [{ data: translations = [] }, { data: specRows = [] }] = ids.length
    ? await Promise.all([
        database.from("product_translations").select("product_id,locale,name,slug,short_description,description,key_specification,seo_title,seo_description").in("product_id", ids),
        database.from("product_specifications").select("product_id,locale,label,value,position").in("product_id", ids).order("position"),
      ])
    : [{ data: [] }, { data: [] }];

  const brands: Option[] = (brandRows ?? []).map((item) => ({
    id: item.id,
    name: brandNames?.find((name) => name.brand_id === item.id)?.name || `برند ${item.id}`,
  }));
  const categories: Option[] = (categoryRows ?? []).map((item) => ({
    id: item.id,
    brand_id: item.brand_id,
    name: categoryNames?.find((name) => name.category_id === item.id)?.name || `دسته ${item.id}`,
  }));
  const products: Product[] = (productRows ?? []).map((item) => ({
    ...item,
    translations: (translations ?? []).filter((translation) => translation.product_id === item.id),
    specs: (specRows ?? []).filter((spec) => spec.product_id === item.id),
  }));
  const allLandingRows = (landingRows ?? []) as LandingRow[];

  return (
    <main className="admin-module-page admin-products-page">
      <header><div><div><small>کاتالوگ</small><h1>محصولات</h1><p>تمام محتوای کارت و صفحه اختصاصی هر محصول از این بخش مدیریت می‌شود.</p></div></div></header>
      {query.error ? <p className="admin-alert error">{query.error}</p> : null}
      {query.saved ? <p className="admin-alert success">محصول ذخیره شد.</p> : null}
      {query.deleted ? <p className="admin-alert success">محصول حذف شد.</p> : null}

      <section className="admin-product-stats" aria-label="آمار محصولات">
        <article><small>کل محصولات</small><strong>{products.length}</strong><span>رکورد ثبت‌شده</span></article>
        <article><small>منتشرشده</small><strong>{products.filter((item) => item.is_published).length}</strong><span>قابل مشاهده در سایت</span></article>
        <article><small>محصولات ویژه</small><strong>{products.filter((item) => item.is_featured).length}</strong><span>نمایش برجسته</span></article>
        <article><small>برندهای فعال</small><strong>{brands.length}</strong><span>در کاتالوگ محصولات</span></article>
      </section>

      <section className="admin-brand-create">
        <header><h2>افزودن محصول</h2></header>
        {brands.length && categories.length
          ? <ProductForm brands={brands} categories={categories} />
          : <p className="admin-category-prerequisite">ابتدا برند و دسته محصول را ثبت کنید.</p>}
      </section>

      <section className="admin-brand-list">
        <header><h2>محصولات ثبت‌شده</h2><span>{products.length}</span></header>
        {products.length ? products.map((product) => {
          const fa = product.translations.find((translation) => translation.locale === "fa");
          const en = product.translations.find((translation) => translation.locale === "en");
          const productLandingRows = allLandingRows.filter((row) => row.namespace === `product-${product.id}`);
          return (
            <details className="admin-brand-row admin-product-row" key={product.id}>
              <summary>
                <span className="admin-product-thumb">{product.image_url ? <span style={{ backgroundImage: `url(${product.image_url})` }} /> : "DST"}</span>
                <div><strong>{fa?.name || product.sku || "محصول"}</strong><small dir="ltr">{en?.name || product.sku || "—"}</small></div>
                <i className={product.is_published ? "published" : ""}>{product.is_published ? "منتشرشده" : "پیش‌نویس"}</i>
                <b>ویرایش</b>
              </summary>
              <ProductForm brands={brands} categories={categories} product={product} landingRows={productLandingRows} />
              {profile.role !== "seo" ? (
                <form action={deleteProduct} className="admin-brand-delete">
                  <input type="hidden" name="id" value={product.id} />
                  <button>حذف محصول</button>
                </form>
              ) : null}
            </details>
          );
        }) : <div className="admin-catalog-empty"><strong>هنوز محصولی ثبت نشده است</strong></div>}
      </section>
    </main>
  );
}

function ProductForm({ brands, categories, product, landingRows = [] }: { brands: Option[]; categories: Option[]; product?: Product; landingRows?: LandingRow[] }) {
  const fa = product?.translations.find((translation) => translation.locale === "fa");
  const en = product?.translations.find((translation) => translation.locale === "en");
  return (
    <form action={saveProduct} className="admin-catalog-form admin-product-form">
      {product ? <input type="hidden" name="id" value={product.id} /> : null}
      <label><span>برند</span><select name="brand_id" required defaultValue={product?.brand_id}>{brands.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label>
        <span>دسته محصول</span>
        <select name="category_id" required defaultValue={product?.category_id}>
          {brands.map((brand) => (
            <optgroup label={brand.name} key={brand.id}>
              {categories.filter((item) => item.brand_id === brand.id).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </optgroup>
          ))}
        </select>
      </label>
      <label><span>کد کالا</span><input name="sku" dir="ltr" defaultValue={product?.sku ?? ""} /></label>
      <label><span>ترتیب نمایش</span><input name="position" type="number" min="0" defaultValue={product?.position ?? 0} /></label>
      <AdminUploadField name="image_url" label="تصویر شاخص کارت محصول" folder="products" accept="image/jpeg,image/png,image/webp,image/avif" defaultValue={product?.image_url ?? ""} />
      <input type="hidden" name="datasheet_url" value={product?.datasheet_url ?? ""} />

      <ProductLocale locale="fa" value={fa} specs={product?.specs} />
      <ProductLocale locale="en" value={en} specs={product?.specs} />
      <ProductLandingEditor rows={landingRows} />
      <ProductAdvancedEditor productId={product?.id} />

      <div className="admin-product-checks">
        <label><input type="checkbox" name="is_featured" defaultChecked={product?.is_featured} /><span>محصول ویژه</span></label>
        <label><input type="checkbox" name="is_published" defaultChecked={product?.is_published} /><span>نمایش در وب‌سایت</span></label>
      </div>
      <button>{product ? "ذخیره همه اطلاعات محصول" : "ثبت کامل محصول"}</button>
    </form>
  );
}

function ProductLocale({ locale, value: translation, specs }: { locale: "fa" | "en"; value?: Translation; specs?: Spec[] }) {
  const fa = locale === "fa";
  const specText = specs
    ?.filter((spec) => spec.locale === locale)
    .sort((a, b) => a.position - b.position)
    .map((spec) => `${spec.label} | ${spec.value}`)
    .join("\n");
  return (
    <fieldset dir={fa ? "rtl" : "ltr"}>
      <legend>{fa ? "محتوای فارسی" : "English content"}</legend>
      <label><span>{fa ? "نام محصول" : "Product name"}</span><input name={`${locale}_name`} required defaultValue={translation?.name} /></label>
      <label><span>{fa ? "نشانی" : "Slug"}</span><input name={`${locale}_slug`} dir="ltr" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" defaultValue={translation?.slug} /></label>
      <label className="wide"><span>{fa ? "توضیح کوتاه" : "Short description"}</span><textarea name={`${locale}_short`} rows={2} defaultValue={translation?.short_description ?? ""} /></label>
      <label className="wide"><span>{fa ? "توضیحات کامل" : "Full description"}</span><textarea name={`${locale}_description`} rows={5} defaultValue={translation?.description ?? ""} /></label>
      <label><span>{fa ? "مشخصه کلیدی" : "Key specification"}</span><input name={`${locale}_key_spec`} defaultValue={translation?.key_specification ?? ""} /></label>
      <label><span>{fa ? "عنوان سئو" : "SEO title"}</span><input name={`${locale}_seo_title`} defaultValue={translation?.seo_title ?? ""} /></label>
      <label className="wide"><span>{fa ? "توضیحات سئو" : "SEO description"}</span><textarea name={`${locale}_seo_description`} rows={2} defaultValue={translation?.seo_description ?? ""} /></label>
      <label className="wide"><span>{fa ? "مشخصات فنی؛ هر خط: عنوان | مقدار" : "Specifications; each line: label | value"}</span><textarea name={`${locale}_specs`} dir={fa ? "rtl" : "ltr"} rows={5} placeholder={fa ? "ویسکوزیته | 10W-40" : "Viscosity | 10W-40"} defaultValue={specText} /></label>
    </fieldset>
  );
}
