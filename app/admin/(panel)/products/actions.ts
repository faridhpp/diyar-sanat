"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/admin/auth";
import { createClient } from "@/lib/db/server";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
function value(data: FormData, key: string, max = 4000) {
  return String(data.get(key) ?? "").trim().slice(0, max);
}
function fail(message: string): never {
  redirect(`/admin/products?error=${encodeURIComponent(message)}`);
}
function safeAsset(input: string) {
  if (!input) return null;
  if (input.startsWith("/")) return input;
  try {
    const url = new URL(input);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}
function safeHref(input: string) {
  if (!input) return null;
  if (input.startsWith("/") || input.startsWith("#") || input.startsWith("mailto:") || input.startsWith("tel:")) return input;
  try {
    const url = new URL(input);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}
function specs(raw: string, locale: "fa" | "en") {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, position) => {
      const separator = line.indexOf("|");
      if (separator < 1) fail("هر مشخصه باید با قالب «عنوان | مقدار» وارد شود");
      const label = line.slice(0, separator).trim().slice(0, 120);
      const specValue = line.slice(separator + 1).trim().slice(0, 300);
      if (!label || !specValue) fail("عنوان و مقدار مشخصات نمی‌توانند خالی باشند");
      return { locale, label, value: specValue, position };
    });
}
const count = (data: FormData, key: string) =>
  Math.min(30, Math.max(0, Number(value(data, key, 3)) || 0));

export async function saveProduct(data: FormData) {
  await requireStaff();
  const id = Number(value(data, "id", 20)) || null;
  const brandId = Number(value(data, "brand_id", 20));
  const categoryId = Number(value(data, "category_id", 20));
  const faName = value(data, "fa_name", 180);
  const enName = value(data, "en_name", 180);
  const faSlug = value(data, "fa_slug", 120).toLowerCase();
  const enSlug = value(data, "en_slug", 120).toLowerCase();
  if (!brandId || !categoryId) fail("برند و دسته محصول الزامی است");
  if (!faName || !enName) fail("نام فارسی و انگلیسی الزامی است");
  if (!slugPattern.test(faSlug) || !slugPattern.test(enSlug)) fail("نشانی باید انگلیسی و خط‌تیره‌دار باشد");

  const image = value(data, "image_url", 500);
  const datasheet = value(data, "datasheet_url", 500);
  const imageUrl = safeAsset(image);
  const datasheetUrl = safeAsset(datasheet);
  if (image && !imageUrl) fail("نشانی تصویر معتبر نیست");
  if (datasheet && !datasheetUrl) fail("نشانی دیتاشیت معتبر نیست");

  const primaryHrefRaw = value(data, "landing_primary_href", 500);
  const secondaryHrefRaw = value(data, "landing_secondary_href", 500);
  const primaryHref = safeHref(primaryHrefRaw);
  const secondaryHref = safeHref(secondaryHrefRaw);
  if (!primaryHref || !secondaryHref) fail("لینک دکمه‌های صفحه محصول معتبر نیست");

  const landingPairs = [
    ["hero.badge", value(data, "landing_fa_badge", 160), value(data, "landing_en_badge", 160)],
    ["hero.brand_label", value(data, "landing_fa_brand_label", 160), value(data, "landing_en_brand_label", 160)],
    ["origin.value", value(data, "landing_fa_origin", 160), value(data, "landing_en_origin", 160)],
    ["spec.category_label", value(data, "landing_fa_spec_category", 160), value(data, "landing_en_spec_category", 160)],
    ["spec.key_label", value(data, "landing_fa_spec_key", 160), value(data, "landing_en_spec_key", 160)],
    ["spec.brand_label", value(data, "landing_fa_spec_brand", 160), value(data, "landing_en_spec_brand", 160)],
    ["spec.origin_label", value(data, "landing_fa_spec_origin", 160), value(data, "landing_en_spec_origin", 160)],
    ["cta.primary.label", value(data, "landing_fa_primary_label", 180), value(data, "landing_en_primary_label", 180)],
    ["cta.primary.href", primaryHref, primaryHref],
    ["cta.secondary.label", value(data, "landing_fa_secondary_label", 180), value(data, "landing_en_secondary_label", 180)],
    ["cta.secondary.href", secondaryHref, secondaryHref],
    ["related.eyebrow", value(data, "landing_fa_related_eyebrow", 180), value(data, "landing_en_related_eyebrow", 180)],
    ["related.title", value(data, "landing_fa_related_title", 180), value(data, "landing_en_related_title", 180)],
  ] as const;
  if (landingPairs.some(([, fa, en]) => !fa || !en)) fail("تمام متن‌های صفحه لندینگ محصول باید در هر دو زبان تکمیل شوند");

  const parsedSpecs = [
    ...specs(value(data, "fa_specs", 5000), "fa"),
    ...specs(value(data, "en_specs", 5000), "en"),
  ];
  const database = await createClient();
  const { data: category } = await database
    .from("product_categories")
    .select("id,brand_id")
    .eq("id", categoryId)
    .maybeSingle();
  if (!category || category.brand_id !== brandId) fail("دسته انتخاب‌شده متعلق به این برند نیست");

  const published = data.get("is_published") === "on";
  const base = {
    brand_id: brandId,
    category_id: categoryId,
    sku: value(data, "sku", 80) || null,
    image_url: imageUrl,
    datasheet_url: datasheetUrl,
    is_featured: data.get("is_featured") === "on",
    is_published: published,
    position: Math.max(0, Number(value(data, "position", 6)) || 0),
    published_at: published ? new Date().toISOString() : null,
  };

  let productId = id;
  let created = false;
  if (productId) {
    const { error } = await database.from("products").update(base).eq("id", productId);
    if (error) fail("ویرایش محصول انجام نشد");
  } else {
    const { data: row, error } = await database.from("products").insert(base).select("id").single();
    if (error || !row) fail("ثبت محصول انجام نشد؛ کد کالا باید یکتا باشد");
    productId = row.id;
    created = true;
  }

  const translations = (["fa", "en"] as const).map((locale) => ({
    product_id: productId!,
    locale,
    name: locale === "fa" ? faName : enName,
    slug: locale === "fa" ? faSlug : enSlug,
    short_description: value(data, `${locale}_short`, 500) || null,
    description: value(data, `${locale}_description`, 8000) || null,
    key_specification: value(data, `${locale}_key_spec`, 240) || null,
    seo_title: value(data, `${locale}_seo_title`, 180) || null,
    seo_description: value(data, `${locale}_seo_description`, 320) || null,
  }));
  const { error: translationError } = await database
    .from("product_translations")
    .upsert(translations, { onConflict: "product_id,locale" });
  if (translationError) {
    if (created) await database.from("products").delete().eq("id", productId);
    fail("محتوای محصول ذخیره نشد؛ نشانی هر زبان باید یکتا باشد");
  }

  const landingNamespace = `product-${productId}`;
  const landingRows = landingPairs.flatMap(([translationKey, fa, en]) => ([
    { namespace: landingNamespace, translation_key: translationKey, locale: "fa" as const, value: fa, description: "محتوای صفحه اختصاصی محصول" },
    { namespace: landingNamespace, translation_key: translationKey, locale: "en" as const, value: en, description: "Product landing page content" },
  ]));
  const { error: landingError } = await database
    .from("site_translations")
    .upsert(landingRows, { onConflict: "namespace,translation_key,locale" });
  if (landingError) fail("متن‌های صفحه لندینگ محصول ذخیره نشد");

  const { error: deleteError } = await database.from("product_specifications").delete().eq("product_id", productId);
  if (deleteError) fail("به‌روزرسانی مشخصات فنی انجام نشد");
  if (parsedSpecs.length) {
    const { error } = await database
      .from("product_specifications")
      .insert(parsedSpecs.map((item) => ({ ...item, product_id: productId! })));
    if (error) fail("ثبت مشخصات فنی انجام نشد");
  }

  const primary = Number(value(data, "gallery_primary", 3)) || 0;
  const images = Array.from({ length: count(data, "gallery_count") }, (_, position) => ({
    product_id: productId!,
    file_url: safeAsset(value(data, `gallery_url_${position}`, 500)),
    alt_fa: value(data, `gallery_alt_fa_${position}`, 240),
    alt_en: value(data, `gallery_alt_en_${position}`, 240),
    is_primary: position === primary,
    position,
  }))
    .filter((item) => item.file_url && item.alt_fa && item.alt_en)
    .map((item) => ({ ...item, file_url: item.file_url! }));

  const allowedIcons = new Set(["shield", "droplet", "gear", "snowflake", "thermometer", "flask", "brake", "oil", "package", "check", "star", "leaf"]);
  const features = Array.from({ length: count(data, "feature_count") }, (_, position) => ({
    product_id: productId!,
    icon_key: value(data, `feature_icon_${position}`, 30),
    title_fa: value(data, `feature_title_fa_${position}`, 160),
    title_en: value(data, `feature_title_en_${position}`, 160),
    description_fa: value(data, `feature_description_fa_${position}`, 500) || null,
    description_en: value(data, `feature_description_en_${position}`, 500) || null,
    position,
  })).filter((item) => allowedIcons.has(item.icon_key) && item.title_fa && item.title_en);

  const applications = Array.from({ length: count(data, "application_count") }, (_, position) => ({
    product_id: productId!,
    title_fa: value(data, `application_title_fa_${position}`, 160),
    title_en: value(data, `application_title_en_${position}`, 160),
    description_fa: value(data, `application_description_fa_${position}`, 600) || null,
    description_en: value(data, `application_description_en_${position}`, 600) || null,
    position,
  })).filter((item) => item.title_fa && item.title_en);

  const allowedTypes = new Set(["catalog", "datasheet", "certificate", "manual", "other"]);
  const downloads = Array.from({ length: count(data, "download_count") }, (_, position) => ({
    product_id: productId!,
    file_url: safeAsset(value(data, `download_url_${position}`, 500)),
    title_fa: value(data, `download_title_fa_${position}`, 160),
    title_en: value(data, `download_title_en_${position}`, 160),
    file_type: value(data, `download_type_${position}`, 30) as "catalog" | "datasheet" | "certificate" | "manual" | "other",
    position,
  }))
    .filter((item) => item.file_url && item.title_fa && item.title_en && allowedTypes.has(item.file_type))
    .map((item) => ({ ...item, file_url: item.file_url! }));

  for (const table of ["product_images", "product_features", "product_applications", "product_downloads"] as const) {
    const { error } = await database.from(table).delete().eq("product_id", productId);
    if (error) fail("به‌روزرسانی محتوای تکمیلی محصول انجام نشد");
  }
  if (images.length) {
    const { error } = await database.from("product_images").insert(images);
    if (error) fail("ثبت گالری محصول انجام نشد");
  }
  if (features.length) {
    const { error } = await database.from("product_features").insert(features);
    if (error) fail("ثبت ویژگی‌های محصول انجام نشد");
  }
  if (applications.length) {
    const { error } = await database.from("product_applications").insert(applications);
    if (error) fail("ثبت کاربردهای محصول انجام نشد");
  }
  if (downloads.length) {
    const { error } = await database.from("product_downloads").insert(downloads);
    if (error) fail("ثبت فایل‌های محصول انجام نشد");
  }

  revalidatePath("/admin/products");
  revalidatePath("/fa/products", "layout");
  revalidatePath("/en/products", "layout");
  revalidatePath("/", "layout");
  redirect("/admin/products?saved=1");
}

export async function deleteProduct(data: FormData) {
  const { profile } = await requireStaff();
  if (profile.role === "seo") fail("حذف محصول برای این نقش مجاز نیست");
  const id = Number(value(data, "id", 20));
  if (!id) fail("شناسه محصول نامعتبر است");
  const database = await createClient();
  const { error } = await database.from("products").delete().eq("id", id);
  if (error) fail("حذف محصول انجام نشد");
  await database.from("site_translations").delete().eq("namespace", `product-${id}`);
  revalidatePath("/admin/products");
  revalidatePath("/fa/products", "layout");
  revalidatePath("/en/products", "layout");
  revalidatePath("/", "layout");
  redirect("/admin/products?deleted=1");
}
