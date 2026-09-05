import "server-only";
import type {Metadata} from "next";
import type {Locale} from "@/lib/i18n";
import {createClient} from "@/lib/db/server";

export async function getManagedMetadata(locale:Locale,route:string,fallback:Metadata):Promise<Metadata>{
  const{data}=await(await createClient()).from("seo_settings").select("title,description,canonical_url,robots_index,robots_follow,og_image_url").eq("locale",locale).eq("route",route).maybeSingle();
  if(!data)return fallback;
  return{...fallback,title:data.title,description:data.description,alternates:{...(fallback.alternates??{}),canonical:data.canonical_url||`/${locale}${route==="/"?"":route}`},robots:{index:data.robots_index,follow:data.robots_follow},openGraph:{title:data.title,description:data.description,images:data.og_image_url?[data.og_image_url]:undefined}};
}

export async function getManagedTranslations(locale:Locale,namespace:string){
  const{data}=await(await createClient()).from("site_translations").select("translation_key,value").eq("locale",locale).eq("namespace",namespace);
  return Object.fromEntries((data??[]).map(item=>[item.translation_key,item.value]));
}
