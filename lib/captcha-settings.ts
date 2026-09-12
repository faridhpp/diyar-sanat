import "server-only";
import { repository } from "@/lib/db/query";

export async function captchaEnabled() {
  const { data } = await repository({ role: "app_visitor" })
    .from("admin_settings")
    .select("require_captcha")
    .eq("id", true)
    .maybeSingle();
  return data?.require_captcha === true;
}
