import { AdminUploadField } from "@/components/admin-upload-field";
import { requireStaff } from "@/lib/admin/auth";
import { createClient } from "@/lib/db/server";
import { redirect } from "next/navigation";
import { saveSiteSettings } from "./actions";

type Props = { searchParams: Promise<Record<string, string | undefined>> };

export default async function SiteSettingsPage({ searchParams }: Props) {
  const [{ profile }, query] = await Promise.all([requireStaff(), searchParams]);
  if (profile.role !== "manager") redirect("/admin");
  const db = await createClient();
  const [{ data }, { data: headerLabels }] = await Promise.all([
    db.from("site_settings").select("*").eq("id", true).maybeSingle(),
    db
      .from("site_translations")
      .select("locale,value")
      .eq("namespace", "global-header")
      .eq("translation_key", "brand.label"),
  ]);
  if (!data)
    return (
      <main className="admin-module-page">
        <p className="admin-alert error">Migration تنظیمات سایت هنوز اجرا نشده است.</p>
      </main>
    );

  const headerLabelFa =
    headerLabels?.find((item) => item.locale === "fa")?.value?.trim() || "دیار صنعت";
  const headerLabelEn =
    headerLabels?.find((item) => item.locale === "en")?.value?.trim() || "Diyar Sanat";

  return (
    <main className="admin-module-page admin-site-settings-page">
      <header>
        <div>
          <div>
            <small>هویت و تنظیمات عمومی</small>
            <h1>تنظیمات سایت</h1>
            <p>عنوان رسمی سایت، متن کنار لوگو، لوگوهای عمومی و لوگوی مستقل پنل مدیریت</p>
          </div>
        </div>
      </header>
      {query.saved ? <p className="admin-alert success">تنظیمات سایت ذخیره شد.</p> : null}
      {query.error ? <p className="admin-alert error">ذخیره تنظیمات انجام نشد.</p> : null}
      <form action={saveSiteSettings} className="admin-site-settings-form">
        <section>
          <header>
            <h2>عنوان رسمی سایت و متادیتا</h2>
            <p>این عنوان برای تب مرورگر، متادیتا و نام رسمی سایت استفاده می‌شود و از متن کنار لوگو مستقل است.</p>
          </header>
          <div className="admin-catalog-form">
            <label>
              <span>عنوان فارسی سایت</span>
              <input name="site_title_fa" required defaultValue={data.site_title_fa} />
            </label>
            <label dir="ltr">
              <span>English site title</span>
              <input name="site_title_en" required defaultValue={data.site_title_en} />
            </label>
            <label>
              <span>توضیحات فارسی سایت</span>
              <textarea name="site_description_fa" rows={4} defaultValue={data.site_description_fa} />
            </label>
            <label dir="ltr">
              <span>English site description</span>
              <textarea name="site_description_en" rows={4} defaultValue={data.site_description_en} />
            </label>
          </div>
        </section>

        <section>
          <header>
            <h2>متن کنار لوگوی هدر</h2>
            <p>در هدر سایت، خط اول فارسی و خط دوم انگلیسی نمایش داده می‌شود. این دو فیلد روی عنوان SEO سایت اثری ندارند.</p>
          </header>
          <div className="admin-catalog-form">
            <label>
              <span>خط فارسی کنار لوگو</span>
              <input name="header_label_fa" required defaultValue={headerLabelFa} />
            </label>
            <label dir="ltr">
              <span>English line below the logo</span>
              <input name="header_label_en" required defaultValue={headerLabelEn} />
            </label>
          </div>
        </section>

        <section>
          <header>
            <h2>لوگوی پنل مدیریت</h2>
            <p>این لوگو مخصوص سایدبار پنل مدیریت است و مستقل از لوگوی هدر عمومی سایت ذخیره می‌شود.</p>
          </header>
          <div className="admin-settings-assets">
            <AdminUploadField
              name="admin_logo_url"
              label="آپلود لوگوی پنل مدیریت"
              folder="site-identity"
              accept="image/jpeg,image/png,image/webp"
              defaultValue={data.admin_logo_url ?? ""}
            />
          </div>
        </section>

        <section>
          <header>
            <h2>لوگوها و تصاویر عمومی</h2>
            <p>لوگوی هدر، لوگوی صفحه ورود، فاوآیکن و تصویر پیش‌فرض اشتراک‌گذاری را جداگانه مدیریت کنید.</p>
          </header>
          <div className="admin-settings-assets">
            <AdminUploadField
              name="header_logo_url"
              label="لوگوی هدر سایت"
              folder="site-identity"
              accept="image/jpeg,image/png,image/webp"
              defaultValue={data.header_logo_url ?? ""}
            />
            <AdminUploadField
              name="login_logo_url"
              label="لوگوی صفحه ورود"
              folder="site-identity"
              accept="image/jpeg,image/png,image/webp"
              defaultValue={data.login_logo_url ?? ""}
            />
            <AdminUploadField
              name="favicon_url"
              label="فاوآیکن"
              folder="site-identity"
              accept="image/png,image/webp"
              defaultValue={data.favicon_url ?? ""}
            />
            <AdminUploadField
              name="default_og_image_url"
              label="تصویر پیش‌فرض اشتراک‌گذاری"
              folder="site-identity"
              accept="image/jpeg,image/png,image/webp"
              defaultValue={data.default_og_image_url ?? ""}
            />
          </div>
        </section>

        <section>
          <header>
            <h2>اتصال موتورهای جست‌وجو</h2>
            <p>فقط مقدار Content متاتگ تأیید را وارد کنید، نه اسکریپت دلخواه</p>
          </header>
          <label>
            <span>Google Search Console verification</span>
            <input
              name="google_site_verification"
              dir="ltr"
              defaultValue={data.google_site_verification ?? ""}
            />
          </label>
        </section>
        <footer>
          <button>ذخیره تنظیمات سایت</button>
        </footer>
      </form>
    </main>
  );
}
