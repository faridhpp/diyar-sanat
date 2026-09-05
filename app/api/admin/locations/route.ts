import { NextRequest } from "next/server";
import { getStaffUser } from "@/lib/admin/auth";
import { createClient } from "@/lib/db/server";

export async function GET(request:NextRequest){
  if(!await getStaffUser())return Response.json({error:"unauthorized"},{status:401});
  const params=request.nextUrl.searchParams,mode=params.get("mode")??"countries",db=await createClient();
  if(mode==="countries"){const{data,error}=await db.from("countries").select("id,name_fa,name_en").order("position");return Response.json({items:data??[],error:error?.message});}
  if(mode==="provinces"){const countryId=Number(params.get("country"));if(!countryId)return Response.json({items:[]});const{data,error}=await db.from("provinces").select("id,name_fa,name_en").eq("country_id",countryId).order("position");return Response.json({items:data??[],error:error?.message});}
  const provinceId=Number(params.get("province")),query=(params.get("q")??"").trim().slice(0,80);if(!provinceId)return Response.json({items:[]});let statement=db.from("cities").select("id,name_fa,name_en,province_id").eq("province_id",provinceId).order("name_fa").limit(25);if(query.length>=2)statement=statement.or(`name_fa.ilike.%${query.replace(/[%_,()]/g,"")}%,name_en.ilike.%${query.replace(/[%_,()]/g,"")}%`);const{data,error}=await statement;return Response.json({items:data??[],error:error?.message});
}
