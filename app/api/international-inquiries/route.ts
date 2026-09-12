import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { verifyCaptcha } from "@/lib/captcha";
import { captchaEnabled } from "@/lib/captcha-settings";
import { sameOrigin } from "@/lib/auth/security";
import { createAdminClient } from "@/lib/db/admin";

const types = new Map([["application/pdf", "pdf"], ["application/msword", "doc"], ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "docx"], ["application/vnd.ms-powerpoint", "ppt"], ["application/vnd.openxmlformats-officedocument.presentationml.presentation", "pptx"]]);
const models = ["distribution", "representation", "contract_manufacturing", "other"] as const;

export async function POST(request: Request) {
  if (!sameOrigin(request)) return new Response(null, { status: 403 });
  const form = await request.formData(); const value = (key: string, max = 3000) => String(form.get(key) ?? "").trim().slice(0, max);
  const company = value("company", 180), country = value("country", 120), website = value("website", 500) || null, business = value("sector", 300), experience = value("experience", 3000), products = value("products", 1200), volume = value("volume", 500) || null, cooperation = value("cooperation_type", 40) as (typeof models)[number], file = form.get("profile");
  const requireCaptcha = await captchaEnabled();
  if (!company || !country || !business || !experience || !products || !models.includes(cooperation) || !(file instanceof File) || !types.has(file.type) || file.size === 0 || file.size > 10 * 1024 * 1024 || (requireCaptcha && !verifyCaptcha(form.get("captcha_token"), form.get("captcha"))) || form.get("consent") !== "on") return NextResponse.json({ error: "validation_failed" }, { status: 400 });
  if (website) { try { const url = new URL(website); if (!["http:", "https:"].includes(url.protocol)) throw new Error(); } catch { return NextResponse.json({ error: "invalid_website" }, { status: 400 }); } }
  const db = createAdminClient(), path = `${new Date().getUTCFullYear()}/${randomUUID()}.${types.get(file.type)}`; const { error: uploadError } = await db.storage.from("international-profiles").upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) return NextResponse.json({ error: "upload_failed" }, { status: 503 });
  const trackingCode = `INT-${randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase()}`; const { error } = await db.from("international_inquiries").insert({ tracking_code: trackingCode, locale: form.get("locale") === "en" ? "en" : "fa", company_name: company, country, website, business_field: business, import_distribution_experience: experience, interested_products: products, estimated_volume: volume, cooperation_type: cooperation, company_profile_path: path, consent_at: new Date().toISOString() });
  if (error) { await db.storage.from("international-profiles").remove([path]); return NextResponse.json({ error: "storage_failed" }, { status: 503 }); }
  return NextResponse.json({ trackingCode }, { status: 201 });
}
