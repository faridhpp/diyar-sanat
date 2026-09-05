import {redirect} from "next/navigation";
import {AdminLoginForm} from "@/components/admin-login-form";
import {getStaffUser} from "@/lib/admin/auth";
import {hasDatabaseEnv} from "@/lib/db/env";
import {createClient} from "@/lib/db/server";
import {BrandMark} from "@/components/brand-mark";
export default async function AdminLoginPage(){if(await getStaffUser())redirect("/admin");let loginMethod:"password"|"sms"|"both"="password";let smsReady=false;if(hasDatabaseEnv()){const{data}=await(await createClient()).from("admin_settings").select("login_method,sms_provider,sms_template_key").eq("id",true).maybeSingle();if(data){loginMethod=data.login_method;smsReady=Boolean(data.sms_provider&&data.sms_template_key)}}return <main className="admin-login-page"><div className="admin-login-art"><BrandMark locale="fa"/><p>سامانه مدیریت وب‌سایت دیار صنعت تبریز</p></div><AdminLoginForm loginMethod={loginMethod} smsReady={smsReady}/></main>}
