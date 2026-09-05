"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/admin/auth";
import { createClient } from "@/lib/db/server";

const value=(data:FormData,key:string)=>String(data.get(key)??"").trim();
export async function saveFaq(data:FormData){
  await requireStaff();
  const id=Number(value(data,"id"));
  const row={category_fa:value(data,"category_fa"),category_en:value(data,"category_en"),question_fa:value(data,"question_fa"),question_en:value(data,"question_en"),answer_fa:value(data,"answer_fa"),answer_en:value(data,"answer_en"),position:Math.max(0,Number(value(data,"position"))||0),is_published:data.get("is_published")==="on"};
  if(!row.category_fa||!row.category_en||!row.question_fa||!row.question_en||!row.answer_fa||!row.answer_en)redirect("/admin/faqs?error=validation");
  const db=await createClient();
  const{error}=id?await db.from("faq_items").update(row).eq("id",id):await db.from("faq_items").insert(row);
  if(error)redirect("/admin/faqs?error=save");
  revalidatePath("/fa/faq");revalidatePath("/en/faq");revalidatePath("/admin/faqs");redirect("/admin/faqs?saved=1");
}
export async function deleteFaq(data:FormData){await requireStaff();const id=Number(value(data,"id"));if(id)await(await createClient()).from("faq_items").delete().eq("id",id);revalidatePath("/fa/faq");revalidatePath("/en/faq");redirect("/admin/faqs?deleted=1")}
