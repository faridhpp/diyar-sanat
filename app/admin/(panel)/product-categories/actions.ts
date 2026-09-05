"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/admin/auth";
import { createClient } from "@/lib/db/server";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const colorPattern = /^#[0-9a-f]{6}$/i;
const icons = new Set(["oil", "gear", "brake", "coolant", "fluid", "package"]);
function value(data:FormData,key:string,max=180){return String(data.get(key)??"").trim().slice(0,max)}
function fail(message:string):never{redirect(`/admin/product-categories?error=${encodeURIComponent(message)}`)}

export async function saveCategory(data:FormData){
  await requireStaff();
  const id=Number(value(data,"id",20))||null;
  const brandId=Number(value(data,"brand_id",20));
  const code=value(data,"code",64).toLowerCase();
  const iconKey=value(data,"icon_key",30);
  const accentColor=value(data,"accent_color",7);
  const position=Math.max(0,Number(value(data,"position",6))||0);
  const faName=value(data,"fa_name"),enName=value(data,"en_name");
  const faSlug=value(data,"fa_slug",100).toLowerCase(),enSlug=value(data,"en_slug",100).toLowerCase();
  if(!brandId)fail("انتخاب برند الزامی است");
  if(!slugPattern.test(code)||!slugPattern.test(faSlug)||!slugPattern.test(enSlug))fail("کد و نشانی باید انگلیسی و خط‌تیره‌دار باشند");
  if(!faName||!enName)fail("نام فارسی و انگلیسی الزامی است");
  if(!icons.has(iconKey))fail("آیکن انتخاب‌شده معتبر نیست");
  if(!colorPattern.test(accentColor))fail("رنگ باید با قالب شش‌رقمی وارد شود");
  const database=await createClient();
  const {data:brand}=await database.from("brands").select("id").eq("id",brandId).maybeSingle();
  if(!brand)fail("برند انتخاب‌شده معتبر نیست");
  let categoryId=id,created=false;
  const base={brand_id:brandId,code,icon_key:iconKey,accent_color:accentColor.toLowerCase(),position,is_published:data.get("is_published")==="on"};
  if(categoryId){const{error}=await database.from("product_categories").update(base).eq("id",categoryId);if(error)fail("ویرایش دسته انجام نشد")}
  else{const{data:row,error}=await database.from("product_categories").insert(base).select("id").single();if(error||!row)fail("ثبت دسته انجام نشد؛ کد باید یکتا باشد");categoryId=row.id;created=true}
  const translations=[
    {category_id:categoryId,locale:"fa" as const,name:faName,slug:faSlug,description:value(data,"fa_description",800)||null,seo_title:value(data,"fa_seo_title",180)||null,seo_description:value(data,"fa_seo_description",320)||null},
    {category_id:categoryId,locale:"en" as const,name:enName,slug:enSlug,description:value(data,"en_description",800)||null,seo_title:value(data,"en_seo_title",180)||null,seo_description:value(data,"en_seo_description",320)||null},
  ];
  const{error}=await database.from("product_category_translations").upsert(translations,{onConflict:"category_id,locale"});
  if(error){if(created)await database.from("product_categories").delete().eq("id",categoryId);fail("ترجمه دسته ذخیره نشد؛ نشانی هر زبان باید یکتا باشد")}
  revalidatePath("/admin/product-categories");redirect("/admin/product-categories?saved=1");
}

export async function deleteCategory(data:FormData){
  const{profile}=await requireStaff();if(profile.role==="seo")fail("حذف دسته برای این نقش مجاز نیست");
  const id=Number(value(data,"id",20));if(!id)fail("شناسه دسته نامعتبر است");
  const{error}=await(await createClient()).from("product_categories").delete().eq("id",id);
  if(error)fail("این دسته دارای محصول است و قابل حذف نیست");
  revalidatePath("/admin/product-categories");redirect("/admin/product-categories?deleted=1");
}
