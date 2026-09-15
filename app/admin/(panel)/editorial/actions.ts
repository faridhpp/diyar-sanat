"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/admin/auth";
import { createClient } from "@/lib/db/server";

const val = (data: FormData, key: string, max = 10000) =>
  String(data.get(key) ?? "").trim().slice(0, max);
const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const fail = (message: string): never =>
  redirect(`/admin/editorial?error=${encodeURIComponent(message)}`);

export async function saveMediaCategory(data: FormData) {
  await requireStaff();
  const id = Number(val(data, "id", 20)) || null;
  const code = val(data, "code", 60);
  const slugFa = val(data, "slug_fa", 100);
  const slugEn = val(data, "slug_en", 100);
  if (!slug.test(code) || !slug.test(slugFa) || !slug.test(slugEn)) {
    fail("کد و نشانی معتبر نیست");
  }
  const payload = {
    code,
    name_fa: val(data, "name_fa", 160),
    name_en: val(data, "name_en", 160),
    slug_fa: slugFa,
    slug_en: slugEn,
    position: Math.max(0, Number(val(data, "position", 6)) || 0),
    is_published: data.get("is_published") === "on",
  };
  if (!payload.name_fa || !payload.name_en) fail("نام هر دو زبان الزامی است");
  const db = await createClient();
  const { error } = id
    ? await db.from("media_categories").update(payload).eq("id", id)
    : await db.from("media_categories").insert(payload);
  if (error) fail("ذخیره دسته رسانه انجام نشد");
  revalidatePath("/admin/editorial");
  redirect("/admin/editorial?saved=category");
}

export async function saveEditorial(data: FormData) {
  const { user } = await requireStaff();
  const id = Number(val(data, "id", 20)) || null;
  const kind = val(data, "kind", 10) as "news" | "article" | "guide";
  const faTitle = val(data, "fa_title", 220);
  const enTitle = val(data, "en_title", 220);
  const faSlug = val(data, "fa_slug", 120);
  const enSlug = val(data, "en_slug", 120);

  if (!["news", "article", "guide"].includes(kind) || !faTitle || !enTitle || !slug.test(faSlug) || !slug.test(enSlug)) {
    fail("عنوان، نوع و نشانی هر دو زبان الزامی است");
  }

  const published = data.get("is_published") === "on";
  const asset = (key: string) => {
    const value = val(data, key, 500);
    return !value || value.startsWith("/") || value.startsWith("https://")
      ? value || null
      : fail("نشانی فایل معتبر نیست");
  };

  const base = {
    category_id: Number(val(data, "category_id", 20)) || null,
    kind,
    cover_image_url: asset("cover_image_url"),
    video_url: asset("video_url"),
    cta_url: asset("cta_url"),
    is_featured: data.get("is_featured") === "on",
    is_published: published,
    published_at: published ? new Date().toISOString() : null,
    position: Math.max(0, Number(val(data, "position", 6)) || 0),
    updated_by: user.id,
  };

  const db = await createClient();
  let entryId = id;
  let created = false;
  if (entryId) {
    const { error } = await db.from("editorial_entries").update(base).eq("id", entryId);
    if (error) fail("ویرایش محتوا انجام نشد");
  } else {
    const { data: row, error } = await db
      .from("editorial_entries")
      .insert({ ...base, created_by: user.id })
      .select("id")
      .single();
    if (error || !row) fail("ثبت محتوا انجام نشد");
    entryId = row.id;
    created = true;
  }

  const rows = (["fa", "en"] as const).map((locale) => ({
    entry_id: entryId!,
    locale,
    title: locale === "fa" ? faTitle : enTitle,
    slug: locale === "fa" ? faSlug : enSlug,
    excerpt: val(data, `${locale}_excerpt`, 600) || null,
    body_markdown: val(data, `${locale}_body`, 60000),
    cta_label: val(data, `${locale}_cta_label`, 120) || null,
    seo_title: val(data, `${locale}_seo_title`, 180) || null,
    seo_description: val(data, `${locale}_seo_description`, 320) || null,
  }));

  const { error } = await db
    .from("editorial_translations")
    .upsert(rows, { onConflict: "entry_id,locale" });
  if (error) {
    if (created) await db.from("editorial_entries").delete().eq("id", entryId);
    fail("ترجمه محتوا ذخیره نشد");
  }

  revalidatePath("/admin/editorial");
  revalidatePath("/fa/media");
  revalidatePath("/en/media");
  revalidatePath("/", "layout");
  redirect("/admin/editorial?saved=entry");
}

export async function deleteEditorial(data: FormData) {
  const { profile } = await requireStaff();
  if (profile.role === "seo") fail("دسترسی حذف ندارید");
  const id = Number(val(data, "id", 20));
  if (!id) fail("شناسه محتوا معتبر نیست");
  const { error } = await (await createClient()).from("editorial_entries").delete().eq("id", id);
  if (error) fail("حذف محتوا انجام نشد");
  revalidatePath("/admin/editorial");
  revalidatePath("/fa/media");
  revalidatePath("/en/media");
  revalidatePath("/", "layout");
  redirect("/admin/editorial?deleted=1");
}
