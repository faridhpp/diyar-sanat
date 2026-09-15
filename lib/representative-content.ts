import "server-only";

import { createClient } from "@/lib/db/server";
import { isCountry, type Representative } from "@/lib/representatives";

export async function getPublishedRepresentatives(): Promise<Representative[]> {
  const db = await createClient();
  const { data: representativeRows, error: representativeError } = await db
    .from("representatives")
    .select("id,city_id,business_name_fa,business_name_en,manager_name_fa,manager_name_en,address_fa,address_en,phone,whatsapp,directions_url,position,is_published")
    .eq("is_published", true)
    .order("position");

  const reps = representativeRows ?? [];
  if (representativeError || reps.length === 0) return [];

  const cityIds = [...new Set(reps.map((item) => item.city_id))];
  const { data: cityRows, error: cityError } = await db
    .from("cities")
    .select("id,province_id,name_fa,name_en,is_published")
    .in("id", cityIds)
    .eq("is_published", true);
  const cities = cityRows ?? [];
  if (cityError || cities.length === 0) return [];

  const provinceIds = [...new Set(cities.map((item) => item.province_id))];
  const { data: provinceRows, error: provinceError } = await db
    .from("provinces")
    .select("id,country_id,slug,is_published")
    .in("id", provinceIds)
    .eq("is_published", true);
  const provinces = provinceRows ?? [];
  if (provinceError || provinces.length === 0) return [];

  const countryIds = [...new Set(provinces.map((item) => item.country_id))];
  const { data: countryRows, error: countryError } = await db
    .from("countries")
    .select("id,slug,is_published")
    .in("id", countryIds)
    .eq("is_published", true);
  const countries = countryRows ?? [];
  if (countryError || countries.length === 0) return [];

  const cityById = new Map(cities.map((item) => [item.id, item]));
  const provinceById = new Map(provinces.map((item) => [item.id, item]));
  const countryById = new Map(countries.map((item) => [item.id, item]));

  return reps.flatMap((rep): Representative[] => {
    const city = cityById.get(rep.city_id);
    const province = city ? provinceById.get(city.province_id) : undefined;
    const country = province ? countryById.get(province.country_id) : undefined;
    if (!city || !province || !country || !isCountry(country.slug)) return [];

    return [{
      id: String(rep.id),
      country: country.slug,
      region: province.slug,
      cityFa: city.name_fa,
      cityEn: city.name_en,
      businessFa: rep.business_name_fa,
      businessEn: rep.business_name_en || rep.business_name_fa,
      managerFa: rep.manager_name_fa,
      managerEn: rep.manager_name_en || rep.manager_name_fa,
      addressFa: rep.address_fa,
      addressEn: rep.address_en || rep.address_fa,
      phone: rep.phone,
      whatsapp: rep.whatsapp || undefined,
      directions: rep.directions_url || undefined,
    }];
  });
}
