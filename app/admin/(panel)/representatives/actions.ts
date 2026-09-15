"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/admin/auth";
import { createClient } from "@/lib/db/server";

const val = (data: FormData, key: string, max = 600) => String(data.get(key) ?? "").trim().slice(0, max);
const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const phone = /^\+?[0-9]{10,15}$/;
const fail = (message: string): never => redirect(`/admin/representatives?error=${encodeURIComponent(message)}`);

function revalidateRepresentativePages() {
  revalidatePath("/admin/representatives");
  revalidatePath("/fa/representatives", "layout");
  revalidatePath("/en/representatives", "layout");
}

export async function saveRepresentative(data: FormData) {
  const { profile } = await requireStaff();
  if (profile.role === "seo") fail("دسترسی کافی ندارید");

  const id = Number(val(data, "id", 20)) || null;
  const cityId = Number(val(data, "city_id", 20));
  const path = val(data, "slug", 100).toLowerCase();
  const phoneValue = val(data, "phone", 16);
  const whatsapp = val(data, "whatsapp", 16);
  const latitude = val(data, "latitude", 20);
  const longitude = val(data, "longitude", 20);
  const directions = val(data, "directions_url", 500);
  const published = data.get("is_published") === "on";

  if (!cityId || !slug.test(path)) fail("شهر و نشانی معتبر الزامی است");
  if (!phone.test(phoneValue) || (whatsapp && !phone.test(whatsapp))) fail("شماره تماس معتبر نیست");
  if (directions && !directions.startsWith("https://")) fail("مسیریابی باید نشانی HTTPS باشد");

  const required = ["business_name_fa", "manager_name_fa", "address_fa"] as const;
  if (required.some((key) => !val(data, key))) fail("نام مجموعه، مسئول و آدرس فارسی الزامی است");

  const payload = {
    city_id: cityId,
    slug: path,
    business_name_fa: val(data, "business_name_fa"),
    business_name_en: val(data, "business_name_en") || null,
    manager_name_fa: val(data, "manager_name_fa"),
    manager_name_en: val(data, "manager_name_en") || null,
    address_fa: val(data, "address_fa"),
    address_en: val(data, "address_en") || null,
    phone: phoneValue,
    whatsapp: whatsapp || null,
    latitude: latitude ? Number(latitude) : null,
    longitude: longitude ? Number(longitude) : null,
    directions_url: directions || null,
    position: Math.max(0, Number(val(data, "position", 6)) || 0),
    is_published: published,
  };

  const db = await createClient();
  const { data: cityRecord, error: cityError } = await db
    .from("cities")
    .select("id,province_id,is_published")
    .eq("id", cityId)
    .maybeSingle();

  const cityProvinceId = Number(cityRecord?.province_id);
  const cityIsPublished = cityRecord?.is_published === true;
  if (cityError || !Number.isInteger(cityProvinceId) || cityProvinceId <= 0) {
    fail("شهر انتخاب‌شده معتبر نیست");
  }

  if (published) {
    const { data: provinceRecord, error: provinceError } = await db
      .from("provinces")
      .select("id,country_id,is_published")
      .eq("id", cityProvinceId)
      .maybeSingle();

    const provinceCountryId = Number(provinceRecord?.country_id);
    const provinceIsPublished = provinceRecord?.is_published === true;
    if (provinceError || !Number.isInteger(provinceCountryId) || provinceCountryId <= 0) {
      fail("استان شهر انتخاب‌شده معتبر نیست");
    }

    const { data: countryRecord, error: countryError } = await db
      .from("countries")
      .select("id,is_published")
      .eq("id", provinceCountryId)
      .maybeSingle();
    const countryIsPublished = countryRecord?.is_published === true;

    if (countryError || !cityIsPublished || !provinceIsPublished || !countryIsPublished) {
      fail("برای انتشار نماینده، کشور، استان و شهر انتخاب‌شده باید در بخش موقعیت‌ها فعال باشند");
    }
  }

  const { error } = id
    ? await db.from("representatives").update(payload).eq("id", id)
    : await db.from("representatives").insert(payload);
  if (error) fail("ذخیره نماینده انجام نشد؛ نشانی باید یکتا باشد");

  revalidateRepresentativePages();
  redirect("/admin/representatives?saved=1");
}

export async function deleteRepresentative(data: FormData) {
  const { profile } = await requireStaff();
  if (profile.role === "seo") fail("دسترسی کافی ندارید");
  const id = Number(val(data, "id", 20));
  if (!id) fail("شناسه معتبر نیست");
  const { error } = await (await createClient()).from("representatives").delete().eq("id", id);
  if (error) fail("حذف نماینده انجام نشد");
  revalidateRepresentativePages();
  redirect("/admin/representatives?deleted=1");
}
