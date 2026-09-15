import {redirect} from "next/navigation";
import {AdminLoginForm} from "@/components/admin-login-form";
import {getStaffUser} from "@/lib/admin/auth";
import {hasDatabaseEnv} from "@/lib/db/env";
import {createClient} from "@/lib/db/server";
import {BrandMark} from "@/components/brand-mark";
export default async function AdminLoginPage(){if(await getStaffUser())redirect("/admin");let loginMethod:"password"|"sms"|"both"="password";let smsReady=false;let loginLogoUrl:string|null=null;let brandTitle:string|null=null;if(hasDatabaseEnv()){const db=await createClient();const[{data:authSettings},{data:siteSettings}]=await Promise.all([db.from("admin_settings").select("login_method,sms_provider,sms_template_key").eq("id",true).maybeSingle(),db.from("site_settings").select("site_title_fa,login_logo_url").eq("id",true).maybeSingle()]);if(authSettings){loginMethod=authSettings.login_method;smsReady=Boolean(authSettings.sms_provider&&authSettings.sms_template_key)}loginLogoUrl=siteSettings?.login_logo_url??null;brandTitle=siteSettings?.site_title_fa??null}return <main className="admin-login-page"><div className="admin-login-art"><BrandMark locale="fa" logoUrl={loginLogoUrl} title={brandTitle}/><p>سامانه مدیریت وب‌سایت {brandTitle||"دیار صنعت تبریز"}</p></div><AdminLoginForm loginMethod={loginMethod} smsReady={smsReady}/></main>}
