"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/admin/auth";
import { createClient } from "@/lib/db/server";

const v = (data: FormData, key: string, max = 1000) =>
  String(data.get(key) ?? "").trim().slice(0, max);
const asset = (input: string) =>
  !input || input.startsWith("/") || /^https:\/\//.test(input) ? input || null : null;

export async function saveSiteSettings(data: FormData) {
  const { user, profile } = await requireStaff();
  if (profile.role !== "manager") redirect("/admin");

  const headerLabelFa = v(data, "header_label_fa", 120);
  const headerLabelEn = v(data, "header_label_en", 120);
  const row = {
    site_title_fa: v(data, "site_title_fa", 160),
    site_title_en: v(data, "site_title_en", 160),
    site_description_fa: v(data, "site_description_fa", 500),
    site_description_en: v(data, "site_description_en", 500),
    header_logo_url: asset(v(data, "header_logo_url")),
    admin_logo_url: asset(v(data, "admin_logo_url")),
    login_logo_url: asset(v(data, "login_logo_url")),
    favicon_url: asset(v(data, "favicon_url")),
    default_og_image_url: asset(v(data, "default_og_image_url")),
    google_site_verification: v(data, "google_site_verification", 250) || null,
    updated_by: user.id,
  };

  if (!row.site_title_fa || !row.site_title_en || !headerLabelFa || !headerLabelEn) {
    redirect("/admin/site-settings?error=validation");
  }

  const db = await createClient();
  const [{ error: settingsError }, { error: headerError }] = await Promise.all([
    db.from("site_settings").update(row).eq("id", true),
    db.from("site_translations").upsert(
      [
        {
          namespace: "global-header",
          translation_key: "brand.label",
          locale: "fa" as const,
          value: headerLabelFa,
          description: "خط فارسی کنار لوگوی هدر",
        },
        {
          namespace: "global-header",
          translation_key: "brand.label",
          locale: "en" as const,
          value: headerLabelEn,
          description: "English line below the header logo",
        },
      ],
      { onConflict: "namespace,translation_key,locale" },
    ),
  ]);

  if (settingsError || headerError) redirect("/admin/site-settings?error=save");
  revalidatePath("/", "layout");
  revalidatePath("/admin/site-settings");
  redirect("/admin/site-settings?saved=1");
}
