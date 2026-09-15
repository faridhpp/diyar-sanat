type Row = {
  locale: "fa" | "en";
  translation_key: string;
  value: string;
};

type Defaults = Record<string, { fa: string; en: string }>;

const defaults: Defaults = {
  "hero.badge": { fa: "ساخت ایران", en: "Made in Iran" },
  "hero.brand_label": { fa: "برند محصول", en: "Product brand" },
  "origin.value": { fa: "ایران", en: "Iran" },
  "spec.category_label": { fa: "گروه محصول", en: "Category" },
  "spec.key_label": { fa: "مشخصه کلیدی", en: "Key specification" },
  "spec.brand_label": { fa: "برند", en: "Brand" },
  "spec.origin_label": { fa: "کشور سازنده", en: "Country of origin" },
  "cta.primary.label": { fa: "استعلام و مشاوره خرید", en: "Request pricing and advice" },
  "cta.primary.href": { fa: "/contact", en: "/contact" },
  "cta.secondary.label": { fa: "مشاهده همه محصولات", en: "View all products" },
  "cta.secondary.href": { fa: "/products", en: "/products" },
  "related.eyebrow": { fa: "پیشنهادهای دیگر", en: "More products" },
  "related.title": { fa: "محصولات مرتبط", en: "Related products" },
};

const field = (rows: Row[], locale: "fa" | "en", key: string) =>
  rows.find((row) => row.locale === locale && row.translation_key === key)?.value ?? defaults[key]?.[locale] ?? "";

export function ProductLandingEditor({ rows = [] }: { rows?: Row[] }) {
  const sharedPrimaryHref = field(rows, "fa", "cta.primary.href") || field(rows, "en", "cta.primary.href");
  const sharedSecondaryHref = field(rows, "fa", "cta.secondary.href") || field(rows, "en", "cta.secondary.href");

  return <section className="admin-builder-section wide">
    <header>
      <div>
        <h3>متن‌های صفحه لندینگ محصول</h3>
        <p>تمام نوشته‌های اختصاصی که در هدر، کارت مشخصات، دکمه‌ها و محصولات مرتبط دیده می‌شوند از همین بخش مدیریت می‌شوند.</p>
      </div>
    </header>
    <div className="admin-content-languages">
      <fieldset dir="rtl">
        <legend>فارسی</legend>
        <label><span>برچسب بالای محصول</span><input name="landing_fa_badge" required defaultValue={field(rows, "fa", "hero.badge")} /></label>
        <label><span>عنوان کوچک برند</span><input name="landing_fa_brand_label" required defaultValue={field(rows, "fa", "hero.brand_label")} /></label>
        <label><span>کشور سازنده</span><input name="landing_fa_origin" required defaultValue={field(rows, "fa", "origin.value")} /></label>
        <label><span>برچسب گروه محصول</span><input name="landing_fa_spec_category" required defaultValue={field(rows, "fa", "spec.category_label")} /></label>
        <label><span>برچسب مشخصه کلیدی</span><input name="landing_fa_spec_key" required defaultValue={field(rows, "fa", "spec.key_label")} /></label>
        <label><span>برچسب برند</span><input name="landing_fa_spec_brand" required defaultValue={field(rows, "fa", "spec.brand_label")} /></label>
        <label><span>برچسب کشور سازنده</span><input name="landing_fa_spec_origin" required defaultValue={field(rows, "fa", "spec.origin_label")} /></label>
        <label><span>متن دکمه اصلی</span><input name="landing_fa_primary_label" required defaultValue={field(rows, "fa", "cta.primary.label")} /></label>
        <label><span>متن دکمه دوم</span><input name="landing_fa_secondary_label" required defaultValue={field(rows, "fa", "cta.secondary.label")} /></label>
        <label><span>پیش‌عنوان محصولات مرتبط</span><input name="landing_fa_related_eyebrow" required defaultValue={field(rows, "fa", "related.eyebrow")} /></label>
        <label><span>عنوان محصولات مرتبط</span><input name="landing_fa_related_title" required defaultValue={field(rows, "fa", "related.title")} /></label>
      </fieldset>
      <fieldset dir="ltr">
        <legend>English</legend>
        <label><span>Top badge</span><input name="landing_en_badge" required defaultValue={field(rows, "en", "hero.badge")} /></label>
        <label><span>Brand label</span><input name="landing_en_brand_label" required defaultValue={field(rows, "en", "hero.brand_label")} /></label>
        <label><span>Country of origin</span><input name="landing_en_origin" required defaultValue={field(rows, "en", "origin.value")} /></label>
        <label><span>Category label</span><input name="landing_en_spec_category" required defaultValue={field(rows, "en", "spec.category_label")} /></label>
        <label><span>Key specification label</span><input name="landing_en_spec_key" required defaultValue={field(rows, "en", "spec.key_label")} /></label>
        <label><span>Brand field label</span><input name="landing_en_spec_brand" required defaultValue={field(rows, "en", "spec.brand_label")} /></label>
        <label><span>Origin field label</span><input name="landing_en_spec_origin" required defaultValue={field(rows, "en", "spec.origin_label")} /></label>
        <label><span>Primary CTA label</span><input name="landing_en_primary_label" required defaultValue={field(rows, "en", "cta.primary.label")} /></label>
        <label><span>Secondary CTA label</span><input name="landing_en_secondary_label" required defaultValue={field(rows, "en", "cta.secondary.label")} /></label>
        <label><span>Related eyebrow</span><input name="landing_en_related_eyebrow" required defaultValue={field(rows, "en", "related.eyebrow")} /></label>
        <label><span>Related products title</span><input name="landing_en_related_title" required defaultValue={field(rows, "en", "related.title")} /></label>
      </fieldset>
    </div>
    <div className="admin-content-technical">
      <label>
        <span>لینک دکمه اصلی</span>
        <input name="landing_primary_href" dir="ltr" required defaultValue={sharedPrimaryHref || "/contact"} placeholder="/contact" />
      </label>
      <label>
        <span>لینک دکمه دوم</span>
        <input name="landing_secondary_href" dir="ltr" required defaultValue={sharedSecondaryHref || "/products"} placeholder="/products" />
      </label>
    </div>
    <p style={{ margin: 0, color: "#697b89", fontSize: 10, lineHeight: 1.9 }}>
      مزیت‌ها، کاربردها، گالری، مشخصات فنی و فایل‌های دانلود نیز در بخش‌های پایین همین فرم مدیریت می‌شوند؛ صفحه عمومی دیگر مزیت اختصاصی ساختگی اضافه نمی‌کند.
    </p>
  </section>;
}
