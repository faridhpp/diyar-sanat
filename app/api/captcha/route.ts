import { NextResponse } from "next/server";
import { createCaptcha } from "@/lib/captcha";
import { captchaEnabled } from "@/lib/captcha-settings";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!(await captchaEnabled())) {
    return NextResponse.json(
      { enabled: false },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  }
  const locale = new URL(request.url).searchParams.get("locale") === "fa" ? "fa" : "en";
  const captcha = createCaptcha();
  const question = locale === "fa" ? captcha.question.replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)]) : captcha.question;
  return NextResponse.json(
    { enabled: true, ...captcha, question },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
