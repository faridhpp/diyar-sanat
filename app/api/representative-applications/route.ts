import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { verifyCaptcha } from "@/lib/captcha";
import { captchaEnabled } from "@/lib/captcha-settings";
import { sameOrigin } from "@/lib/auth/security";
import { createAdminClient } from "@/lib/db/admin";

const types = new Map([["application/pdf", "pdf"], ["application/msword", "doc"], ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "docx"], ["image/jpeg", "jpg"], ["image/png", "png"]]); const phone = /^\+?[0-9]{10,15}$/;
export async function POST(request: Request) {
  if (!sameOrigin(request)) return new Response(null, { status: 403 });
  const form = await request.formData(), value = (key: string, max = 2000) => String(form.get(key) ?? "").trim().slice(0, max), mobile = value("mobile", 20).replace(/[\s-]/g, ""), required = ["fullName", "identityCode", "businessName", "businessType", "region", "city", "address", "experience", "distributionArea"] as const, file = form.get("document");
  const requireCaptcha = await captchaEnabled();
  if ((requireCaptcha && !verifyCaptcha(form.get("captcha_token"), form.get("captcha"))) || form.get("consent") !== "true" || !phone.test(mobile) || required.some((key) => !value(key))) return NextResponse.json({ error: "validation_failed" }, { status: 400 });
  if (file instanceof File && file.size > 0 && (!types.has(file.type) || file.size > 10 * 1024 * 1024)) return NextResponse.json({ error: "invalid_document" }, { status: 400 });
  const db = createAdminClient(); let path: string | null = null; if (file instanceof File && file.size > 0) { path = `${new Date().getUTCFullYear()}/${randomUUID()}.${types.get(file.type)}`; const { error } = await db.storage.from("representative-documents").upload(path, file, { contentType: file.type, upsert: false }); if (error) return NextResponse.json({ error: "upload_failed" }, { status: 503 }); }
  let facilities: string[] = []; try { const parsed = JSON.parse(value("facilities", 1000)); if (Array.isArray(parsed)) facilities = parsed.filter((item): item is string => typeof item === "string").slice(0, 10); } catch { /* optional field */ }
  const trackingCode = `DST-${randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase()}`; const { error } = await db.from("representative_applications").insert({ tracking_code: trackingCode, locale: form.get("locale") === "en" ? "en" : "fa", full_name: value("fullName", 180), identity_code: value("identityCode", 80), mobile, email: value("email", 180) || null, business_name: value("businessName", 180), business_type: value("businessType", 180), country_code: form.get("country") === "iraq" ? "IQ" : "IR", region: value("region", 180), city: value("city", 180), address: value("address", 600), experience: value("experience", 2000), distribution_area: value("distributionArea", 1200), facilities, document_path: path, notes: value("notes", 2000) || null, consent_at: new Date().toISOString() });
  if (error) { if (path) await db.storage.from("representative-documents").remove([path]); return NextResponse.json({ error: "storage_failed" }, { status: 503 }); } return NextResponse.json({ trackingCode }, { status: 201 });
}
