"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/admin/auth";
import { createClient } from "@/lib/db/server";

const v = (data: FormData, key: string, max = 800) => String(data.get(key) ?? "").trim().slice(0, max);
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function finish(path: string, result = "saved") {
  revalidatePath(path);
  redirect(`${path}?${result}=1`);
}

async function requireEditor(canDelete = false) {
  const staff = await requireStaff();
  if (staff.profile.role === "seo" && canDelete) redirect("/admin");
  return staff;
}

export async function createCertificate(data: FormData) {
  await requireEditor();
  const id = Number(v(data, "id", 20)) || null;
  const code = v(data, "code", 80);
  const title_fa = v(data, "title_fa");
  const title_en = v(data, "title_en");
  const certificate_number = v(data, "certificate_number", 100);
  if (!slugPattern.test(code) || !title_fa || !title_en || !certificate_number) redirect("/admin/certificates?error=validation");
  const payload = { code, title_fa, title_en, certificate_number, issuer_fa: v(data, "issuer_fa") || null, issuer_en: v(data, "issuer_en") || null, document_url: v(data, "document_url") || null, image_url: v(data, "image_url") || null, position: Math.max(0, Number(v(data, "position", 6)) || 0), is_published: data.get("is_published") === "on" };
  const db = await createClient();
  const { error } = id ? await db.from("certificates").update(payload).eq("id", id) : await db.from("certificates").insert(payload);
  if (error) redirect("/admin/certificates?error=save");
  finish("/admin/certificates");
}

export async function deleteCertificate(data: FormData) {
  await requireEditor(true);
  const id = Number(v(data, "id", 20));
  if (!id) redirect("/admin/certificates?error=validation");
  const { error } = await (await createClient()).from("certificates").delete().eq("id", id);
  if (error) redirect("/admin/certificates?error=delete");
  finish("/admin/certificates", "deleted");
}

export async function createAlbum(data: FormData) {
  await requireEditor();
  const id = Number(v(data, "id", 20)) || null;
  const slug = v(data, "slug", 100), title_fa = v(data, "title_fa"), title_en = v(data, "title_en");
  if (!slugPattern.test(slug) || !title_fa || !title_en) redirect("/admin/galleries?error=validation");
  const payload = { slug, title_fa, title_en, description_fa: v(data, "description_fa") || null, description_en: v(data, "description_en") || null, cover_url: v(data, "cover_url") || null, position: Math.max(0, Number(v(data, "position", 6)) || 0), is_published: data.get("is_published") === "on" };
  const db = await createClient();
  const { error } = id ? await db.from("gallery_albums").update(payload).eq("id", id) : await db.from("gallery_albums").insert(payload);
  if (error) redirect("/admin/galleries?error=save");
  finish("/admin/galleries");
}

export async function deleteAlbum(data: FormData) {
  await requireEditor(true);
  const id = Number(v(data, "id", 20));
  if (!id) redirect("/admin/galleries?error=validation");
  const { error } = await (await createClient()).from("gallery_albums").delete().eq("id", id);
  if (error) redirect("/admin/galleries?error=delete");
  finish("/admin/galleries", "deleted");
}

export async function createGalleryItem(data: FormData) {
  await requireEditor();
  const id = Number(v(data, "id", 20)) || null;
  const album_id = Number(v(data, "album_id", 20)), file_url = v(data, "file_url"), media_type = v(data, "media_type", 10) as "image" | "video", alt_fa = v(data, "alt_fa"), alt_en = v(data, "alt_en");
  if (!album_id || !file_url || !alt_fa || !alt_en || !["image", "video"].includes(media_type)) redirect("/admin/galleries?error=validation");
  const payload = { album_id, file_url, media_type, alt_fa, alt_en, caption_fa: v(data, "caption_fa") || null, caption_en: v(data, "caption_en") || null, position: Math.max(0, Number(v(data, "position", 6)) || 0), is_published: data.get("is_published") === "on" };
  const db = await createClient();
  const { error } = id ? await db.from("gallery_items").update(payload).eq("id", id) : await db.from("gallery_items").insert(payload);
  if (error) redirect("/admin/galleries?error=save");
  finish("/admin/galleries");
}

export async function deleteGalleryItem(data: FormData) {
  await requireEditor(true);
  const id = Number(v(data, "id", 20));
  if (!id) redirect("/admin/galleries?error=validation");
  const { error } = await (await createClient()).from("gallery_items").delete().eq("id", id);
  if (error) redirect("/admin/galleries?error=delete");
  finish("/admin/galleries", "deleted");
}

export async function createAsset(data: FormData) {
  const { user } = await requireEditor();
  const id = Number(v(data, "id", 20)) || null;
  const asset_type = v(data, "asset_type", 12) as "image" | "video" | "document" | "catalog", title_fa = v(data, "title_fa"), title_en = v(data, "title_en"), file_url = v(data, "file_url");
  if (!["image", "video", "document", "catalog"].includes(asset_type) || !title_fa || !title_en || !file_url) redirect("/admin/media?error=validation");
  const payload = { asset_type, title_fa, title_en, file_url, description_fa: v(data, "description_fa") || null, description_en: v(data, "description_en") || null, thumbnail_url: v(data, "thumbnail_url") || null, is_public: data.get("is_public") === "on", downloadable: data.get("downloadable") === "on", created_by: user.id };
  const db = await createClient();
  const { error } = id ? await db.from("media_assets").update(payload).eq("id", id) : await db.from("media_assets").insert(payload);
  if (error) redirect("/admin/media?error=save");
  revalidatePath("/admin/files");
  finish("/admin/media");
}

export async function deleteAsset(data: FormData) {
  await requireEditor(true);
  const id = Number(v(data, "id", 20));
  if (!id) redirect("/admin/media?error=validation");
  const { error } = await (await createClient()).from("media_assets").delete().eq("id", id);
  if (error) redirect("/admin/media?error=delete");
  revalidatePath("/admin/files");
  finish("/admin/media", "deleted");
}
