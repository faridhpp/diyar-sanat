"use server";
import {redirect} from "next/navigation";import {revalidatePath} from "next/cache";import {requireStaff} from "@/lib/admin/auth";import {createStaffAccount} from "@/lib/auth/accounts";
export async function createStaff(data:FormData){
 const {profile}=await requireStaff();if(profile.role!=="manager")redirect("/admin");
 const email=String(data.get("email")??"").trim().toLowerCase(),password=String(data.get("password")??""),displayName=String(data.get("display_name")??"").trim().slice(0,120),role=String(data.get("role")??"");
 const phone=String(data.get("phone")??"").trim()||undefined;
 if(!["manager","admin","seo"].includes(role)||(phone&&!/^\+989\d{9}$/.test(phone)))redirect("/admin/staff?error=validation");
 try {await createStaffAccount({email,password,displayName,role:role as "manager"|"admin"|"seo",phone});} catch {redirect("/admin/staff?error=create");}
 revalidatePath("/admin/staff");redirect("/admin/staff?created=1");
}
