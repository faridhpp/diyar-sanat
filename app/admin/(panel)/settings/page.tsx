import {AdminSettingsForm} from "@/components/admin-settings-form";
import {requireStaff} from "@/lib/admin/auth";
import {createClient} from "@/lib/db/server";
import {redirect} from "next/navigation";
export default async function AdminSettingsPage(){const{user,profile}=await requireStaff();if(profile.role!=="manager")redirect("/admin");const{data}=await(await createClient()).from("admin_settings").select("login_method,sms_provider,sms_sender,sms_template_key,otp_ttl_seconds,otp_resend_seconds,require_captcha").eq("id",true).single();if(!data)return <main className="admin-module-page"><h1>تنظیمات ورود هنوز در دیتابیس نصب نشده است</h1></main>;return <main className="admin-module-page"><header><div><div><small>امنیت و احراز هویت</small><h1>تنظیمات ورود</h1><p>مدیریت روش ورود و ارائه‌دهنده پیامک</p></div></div></header><AdminSettingsForm initial={data} userId={user.id}/></main>}
