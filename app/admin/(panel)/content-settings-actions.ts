"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/admin/auth";
import { createClient } from "@/lib/db/server";
import type { Json } from "@/lib/db/database.types";
import { normalizeMapEmbed } from "@/lib/content-embeds";

const v = (d: FormData, k: string, n = 6000) => String(d.get(k) ?? "").trim().slice(0, n);
const key = /^[a-z0-9_.-]+$/;
const namespace = /^[a-z0-9_-]+$/;
const route = /^\/[a-z0-9/_-]*$/;
const safeAsset = (input: string) =>
  !input || input.startsWith("/") || /^https:\/\//.test(input) ? input || null : null;
const safeHref = (input: string) => (input.startsWith("/") || /^https:\/\//.test(input) ? input : null);

function publicRevalidate() {
  revalidatePath("/", "layout");
  revalidatePath("/fa");
  revalidatePath("/en");
}

export async function saveTranslation(d: FormData) {
  await requireStaff();
  const ns = v(d, "namespace", 80);
  const translation_key = v(d, "translation_key", 160);
  const fa = v(d, "fa_value");
  const en = v(d, "en_value");
  const description = v(d, "description", 500) || null;
  if (!namespace.test(ns) || !key.test(translation_key) || !fa || !en) {
    redirect("/admin/translations?error=validation");
  }
  const db = await createClient();
  const rows = (["fa", "en"] as const).map((locale) => ({
    namespace: ns,
    translation_key,
    locale,
    value: locale === "fa" ? fa : en,
    description,
  }));
  const { error } = await db.from("site_translations").upsert(rows, {
    onConflict: "namespace,translation_key,locale",
  });
  if (error) redirect("/admin/translations?error=save");
  revalidatePath("/admin/translations");
  publicRevalidate();
  redirect("/admin/translations?saved=1");
}

export async function saveAboutHeroImage(d: FormData) {
  await requireStaff();
  const rawImage = v(d, "hero_image_url", 500);
  const imageUrl = safeAsset(rawImage);
  if (rawImage && !imageUrl) redirect("/admin/translations?error=about-hero-image");

  const rows = (["fa", "en"] as const).map((locale) => ({
    namespace: "about",
    translation_key: "hero.image_url",
    locale,
    value: imageUrl ?? "",
    description: "تصویر هیروی صفحه درباره ما",
  }));
  const { error } = await (await createClient()).from("site_translations").upsert(rows, {
    onConflict: "namespace,translation_key,locale",
  });
  if (error) redirect("/admin/translations?error=about-hero-save");
  revalidatePath("/admin/translations");
  revalidatePath("/fa/about");
  revalidatePath("/en/about");
  revalidatePath("/", "layout");
  redirect("/admin/translations?saved=about-hero-image#content-about");
}

export async function saveFooterTrustMarks(d: FormData) {
  await requireStaff();
  const mark1Image = safeAsset(v(d, "mark1_image_url", 500));
  const mark2Image = safeAsset(v(d, "mark2_image_url", 500));
  const rawMark1Image = v(d, "mark1_image_url", 500);
  const rawMark2Image = v(d, "mark2_image_url", 500);
  if ((rawMark1Image && !mark1Image) || (rawMark2Image && !mark2Image)) {
    redirect("/admin/translations?error=footer-assets");
  }

  const mark1LabelFa = v(d, "mark1_label_fa", 160);
  const mark1LabelEn = v(d, "mark1_label_en", 160);
  const mark2LabelFa = v(d, "mark2_label_fa", 160);
  const mark2LabelEn = v(d, "mark2_label_en", 160);
  const mark1Html = v(d, "mark1_html", 8000);
  const mark2Html = v(d, "mark2_html", 8000);

  const rows = (["fa", "en"] as const).flatMap((locale) => [
    {
      namespace: "global-footer",
      translation_key: "credentials.mark1.label",
      locale,
      value: locale === "fa" ? mark1LabelFa : mark1LabelEn,
      description: "عنوان جایگاه اول نمادهای فوتر",
    },
    {
      namespace: "global-footer",
      translation_key: "credentials.mark1.image_url",
      locale,
      value: mark1Image ?? "",
      description: "تصویر جایگاه اول نمادهای فوتر",
    },
    {
      namespace: "global-footer",
      translation_key: "credentials.mark1.html",
      locale,
      value: mark1Html,
      description: "HTML امن جایگاه اول نمادهای فوتر",
    },
    {
      namespace: "global-footer",
      translation_key: "credentials.mark2.label",
      locale,
      value: locale === "fa" ? mark2LabelFa : mark2LabelEn,
      description: "عنوان جایگاه دوم نمادهای فوتر",
    },
    {
      namespace: "global-footer",
      translation_key: "credentials.mark2.image_url",
      locale,
      value: mark2Image ?? "",
      description: "تصویر جایگاه دوم نمادهای فوتر",
    },
    {
      namespace: "global-footer",
      translation_key: "credentials.mark2.html",
      locale,
      value: mark2Html,
      description: "HTML امن جایگاه دوم نمادهای فوتر",
    },
  ]);

  const { error } = await (await createClient()).from("site_translations").upsert(rows, {
    onConflict: "namespace,translation_key,locale",
  });
  if (error) redirect("/admin/translations?error=footer-save");
  revalidatePath("/admin/translations");
  publicRevalidate();
  redirect("/admin/translations?saved=footer-credentials");
}

export async function saveContactMapEmbed(d: FormData) {
  await requireStaff();
  const raw = v(d, "map_embed", 10000);
  const normalized = normalizeMapEmbed(raw);
  if (raw && !normalized) redirect("/admin/translations?error=map-embed");

  const rows = (["fa", "en"] as const).map((locale) => ({
    namespace: "contact",
    translation_key: "map.embed_url",
    locale,
    value: normalized ?? "",
    description: "Google Maps or OpenStreetMap embed URL for contact page",
  }));
  const { error } = await (await createClient()).from("site_translations").upsert(rows, {
    onConflict: "namespace,translation_key,locale",
  });
  if (error) redirect("/admin/translations?error=map-save");
  revalidatePath("/admin/translations");
  publicRevalidate();
  redirect("/admin/translations?saved=contact-map");
}

export async function saveSeo(d: FormData) {
  await requireStaff();
  const path = v(d, "route", 200);
  const locale = v(d, "locale", 2) as "fa" | "en";
  const title = v(d, "title", 180);
  const description = v(d, "description", 320);
  const canonical_url = v(d, "canonical_url", 500) || null;
  const og_image_url = v(d, "og_image_url", 500) || null;
  const raw = v(d, "structured_data", 10000) || "{}";
  if (!route.test(path) || !["fa", "en"].includes(locale) || !title || !description) {
    redirect("/admin/seo?error=validation");
  }
  let structured_data: Json;
  try {
    structured_data = JSON.parse(raw);
    if (!structured_data || Array.isArray(structured_data) || typeof structured_data !== "object") {
      throw new Error();
    }
  } catch {
    redirect("/admin/seo?error=json");
  }
  const { error } = await (await createClient()).from("seo_settings").upsert(
    {
      route: path,
      locale,
      title,
      description,
      canonical_url,
      og_image_url,
      structured_data,
      robots_index: d.get("robots_index") === "on",
      robots_follow: d.get("robots_follow") === "on",
    },
    { onConflict: "route,locale" },
  );
  if (error) redirect("/admin/seo?error=save");
  revalidatePath("/admin/seo");
  revalidatePath(`/${locale}${path === "/" ? "" : path}`);
  redirect("/admin/seo?saved=1");
}

export async function updateContactStatus(d: FormData) {
  const { user } = await requireStaff();
  const id = Number(v(d, "id", 30));
  const status = v(d, "status", 20) as "new" | "reviewing" | "answered" | "archived";
  const internal_note = v(d, "internal_note", 2000) || null;
  if (!id || !["new", "reviewing", "answered", "archived"].includes(status)) {
    redirect("/admin/contact-submissions?error=validation");
  }
  const { error } = await (await createClient())
    .from("contact_submissions")
    .update({ status, internal_note, reviewed_by: user.id, reviewed_at: new Date().toISOString() })
    .eq("id", id);
  if (error) redirect("/admin/contact-submissions?error=save");
  revalidatePath("/admin/contact-submissions");
  redirect("/admin/contact-submissions?saved=1");
}

export async function saveHeroSlide(d: FormData) {
  await requireStaff();
  const id = Number(v(d, "id", 20)) || null;
  const image_url = safeAsset(v(d, "image_url", 500));
  const primary_href = safeHref(v(d, "primary_href", 500));
  const row = {
    image_url: image_url ?? "",
    alt_fa: v(d, "alt_fa", 240),
    alt_en: v(d, "alt_en", 240),
    kicker_fa: v(d, "kicker_fa", 160),
    kicker_en: v(d, "kicker_en", 160),
    title_fa: v(d, "title_fa", 220),
    title_en: v(d, "title_en", 220),
    subtitle_fa: v(d, "subtitle_fa", 220) || null,
    subtitle_en: v(d, "subtitle_en", 220) || null,
    description_fa: v(d, "description_fa", 800) || null,
    description_en: v(d, "description_en", 800) || null,
    primary_label_fa: v(d, "primary_label_fa", 100) || null,
    primary_label_en: v(d, "primary_label_en", 100) || null,
    primary_href: primary_href ?? "/products",
    secondary_label_fa: v(d, "secondary_label_fa", 100) || null,
    secondary_label_en: v(d, "secondary_label_en", 100) || null,
    secondary_href: safeHref(v(d, "secondary_href", 500)),
    position: Math.max(0, Number(v(d, "position", 5)) || 0),
    is_published: d.get("is_published") === "on",
  };
  if (!image_url || !row.alt_fa || !row.alt_en || !row.title_fa || !row.title_en) {
    redirect("/admin/translations?error=slide-validation");
  }
  const db = await createClient();
  const { error } = id
    ? await db.from("homepage_hero_slides").update(row).eq("id", id)
    : await db.from("homepage_hero_slides").insert(row);
  if (error) redirect("/admin/translations?error=slide-save");
  publicRevalidate();
  redirect("/admin/translations?saved=slide");
}

export async function deleteHeroSlide(d: FormData) {
  await requireStaff();
  const id = Number(v(d, "id", 20));
  if (id) await (await createClient()).from("homepage_hero_slides").delete().eq("id", id);
  publicRevalidate();
  redirect("/admin/translations?deleted=slide");
}

export async function saveHomepageVideo(d: FormData) {
  await requireStaff();
  const video = v(d, "video_url", 500);
  const cover = v(d, "cover_url", 500);
  const row = {
    video_url: safeAsset(video),
    cover_url: safeAsset(cover),
    title_fa: v(d, "title_fa", 180),
    title_en: v(d, "title_en", 180),
    subtitle_fa: v(d, "subtitle_fa", 240) || null,
    subtitle_en: v(d, "subtitle_en", 240) || null,
    description_fa: v(d, "description_fa", 800) || null,
    description_en: v(d, "description_en", 800) || null,
    is_published: d.get("is_published") === "on",
  };
  if ((video && !row.video_url) || (cover && !row.cover_url) || !row.title_fa || !row.title_en) {
    redirect("/admin/translations?error=video-validation");
  }
  const { error } = await (await createClient()).from("homepage_video").update(row).eq("id", true);
  if (error) redirect("/admin/translations?error=video-save");
  publicRevalidate();
  redirect("/admin/translations?saved=video");
}
