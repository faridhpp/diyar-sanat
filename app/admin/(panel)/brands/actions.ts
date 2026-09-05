"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/admin/auth";
import { createClient } from "@/lib/db/server";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function value(data: FormData, key: string, max = 160) {
  return String(data.get(key) ?? "").trim().slice(0, max);
}

function fail(message: string): never {
  redirect(`/admin/brands?error=${encodeURIComponent(message)}`);
}

export async function saveBrand(data: FormData) {
  const { profile } = await requireStaff();
  if (!(["manager", "admin", "seo"] as const).includes(profile.role)) fail("دسترسی کافی ندارید");

  const id = Number(value(data, "id", 20)) || null;
  const code = value(data, "code", 64).toLowerCase();
  const faName = value(data, "fa_name");
  const enName = value(data, "en_name");
  const faSlug = value(data, "fa_slug", 100).toLowerCase();
  const enSlug = value(data, "en_slug", 100).toLowerCase();
  const position = Math.max(0, Number(value(data, "position", 6)) || 0);
  const isPublished = data.get("is_published") === "on";

  if (!slugPattern.test(code) || !slugPattern.test(faSlug) || !slugPattern.test(enSlug)) fail("کد و نشانی باید انگلیسی و خط‌تیره‌دار باشند");
  if (!faName || !enName) fail("نام فارسی و انگلیسی الزامی است");

  const database = await createClient();
  let brandId = id;
  let created = false;
  if (brandId) {
    const { error } = await database.from("brands").update({ code, position, is_published: isPublished }).eq("id", brandId);
    if (error) fail("ویرایش برند انجام نشد");
  } else {
    const { data: brand, error } = await database.from("brands").insert({ code, position, is_published: isPublished }).select("id").single();
    if (error || !brand) fail("ثبت برند انجام نشد؛ کد برند باید یکتا باشد");
    brandId = brand.id;
    created = true;
  }

  const translations = [
    { brand_id: brandId, locale: "fa" as const, name: faName, slug: faSlug, description: value(data, "fa_description", 800) || null },
    { brand_id: brandId, locale: "en" as const, name: enName, slug: enSlug, description: value(data, "en_description", 800) || null },
  ];
  const { error } = await database.from("brand_translations").upsert(translations, { onConflict: "brand_id,locale" });
  if (error) {
    if (created) await database.from("brands").delete().eq("id", brandId);
    fail("ترجمه برند ذخیره نشد؛ نشانی هر زبان باید یکتا باشد");
  }

  revalidatePath("/admin/brands");
  redirect("/admin/brands?saved=1");
}

export async function deleteBrand(data: FormData) {
  const { profile } = await requireStaff();
  if (profile.role === "seo") fail("حذف برند برای این نقش مجاز نیست");
  const id = Number(value(data, "id", 20));
  if (!id) fail("شناسه برند نامعتبر است");
  const { error } = await (await createClient()).from("brands").delete().eq("id", id);
  if (error) fail("برند دارای محصول یا دسته وابسته است و قابل حذف نیست");
  revalidatePath("/admin/brands");
  redirect("/admin/brands?deleted=1");
}
