import "server-only";

import type { Locale } from "@/lib/i18n";
import { createClient } from "@/lib/db/server";
import { hasDatabaseEnv } from "@/lib/db/env";
import { brandName, type BrandCode } from "@/lib/brands";

export type CatalogProduct = {
  id: number;
  slug: string;
  name: string;
  description: string;
  specification: string;
  imageUrl: string | null;
  featured: boolean;
  position: number;
  brandCode: BrandCode;
  brandName: string;
};

export type CatalogCategory = {
  id: number;
  code: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  accentColor: string;
  position: number;
  products: CatalogProduct[];
};

export type CatalogResult = {
  categories: CatalogCategory[];
  source: "postgres" | "fallback";
};

const fallbackCopy = {
  fa: [
    {
      code: "engine-oil",
      slug: "engine-oil",
      name: "روغن موتور",
      description: "روانکاری و محافظت از موتور در شرایط کاری متفاوت",
      icon: "droplet",
      accentColor: "#D12632",
      products: [
        ["advanced-engine-oil-10w40", "روغن موتور پیشرفته", "محافظت پایدار برای کارکرد روزمره موتور", "10W-40"],
        ["diesel-engine-oil-15w40", "روغن موتور دیزل", "روانکاری برای موتورهای دیزل در کاربری‌های مختلف", "15W-40"],
      ],
    },
    {
      code: "gear-oil",
      slug: "gear-oil",
      name: "واسکازین",
      description: "روانکاری پایدار چرخ‌دنده‌ها و سامانه انتقال قدرت",
      icon: "gear",
      accentColor: "#164B82",
      products: [],
    },
    {
      code: "brake-fluid",
      slug: "brake-fluid",
      name: "مایع روغن ترمز",
      description: "انتقال مطمئن فشار و پایداری عملکرد سامانه ترمز",
      icon: "brake",
      accentColor: "#C77A10",
      products: [
        ["brake-fluid-dot4", "مایع روغن ترمز", "برای انتقال فشار در سامانه‌های ترمز سازگار", "DOT 4"],
      ],
    },
    {
      code: "antifreeze",
      slug: "antifreeze",
      name: "ضدیخ و ضدجوش",
      description: "محافظت از سامانه خنک‌کاری در برابر یخ‌زدگی، جوش و خوردگی",
      icon: "snowflake",
      accentColor: "#2877BD",
      products: [
        ["antifreeze-coolant-40", "ضدیخ و ضدجوش", "محافظت از مدار خنک‌کاری در شرایط دمایی مختلف", "-40°C"],
      ],
    },
  ],
  en: [
    {
      code: "engine-oil",
      slug: "engine-oil",
      name: "Engine oil",
      description: "Lubrication and engine protection across operating conditions",
      icon: "droplet",
      accentColor: "#D12632",
      products: [
        ["advanced-engine-oil-10w40", "Advanced engine oil", "Stable protection for everyday engine operation", "10W-40"],
        ["diesel-engine-oil-15w40", "Diesel engine oil", "Lubrication for diesel engines across different use cases", "15W-40"],
      ],
    },
    {
      code: "gear-oil",
      slug: "gear-oil",
      name: "Gear oil",
      description: "Stable lubrication for gears and transmission systems",
      icon: "gear",
      accentColor: "#164B82",
      products: [],
    },
    {
      code: "brake-fluid",
      slug: "brake-fluid",
      name: "Brake fluid",
      description: "Reliable pressure transfer and stable braking performance",
      icon: "brake",
      accentColor: "#C77A10",
      products: [
        ["brake-fluid-dot4", "Brake fluid", "For pressure transfer in compatible braking systems", "DOT 4"],
      ],
    },
    {
      code: "antifreeze",
      slug: "antifreeze",
      name: "Antifreeze and coolant",
      description: "Cooling-system protection from freezing, boiling, and corrosion",
      icon: "snowflake",
      accentColor: "#2877BD",
      products: [
        ["antifreeze-coolant-40", "Antifreeze and coolant", "Cooling-circuit protection across temperature conditions", "-40°C"],
      ],
    },
  ],
} as const;

function fallbackCatalog(locale: Locale): CatalogResult {
  const categories = fallbackCopy[locale].map((category, categoryIndex) => ({
    id: -(categoryIndex + 1),
    code: category.code,
    slug: category.slug,
    name: category.name,
    description: category.description,
    icon: category.icon,
    accentColor: category.accentColor,
    position: categoryIndex + 1,
    products: category.products.map((product, productIndex) => ({
      id: -((categoryIndex + 1) * 10 + productIndex + 1),
      slug: product[0],
      name: product[1],
      description: product[2],
      specification: product[3],
      imageUrl: null,
      featured: true,
      position: productIndex + 1,
      brandCode: "diyar-shimi" as const,
      brandName: brandName("diyar-shimi", locale),
    })),
  }));

  return { categories, source: "fallback" };
}

export async function getCatalog(locale: Locale): Promise<CatalogResult> {
  if (!hasDatabaseEnv()) return fallbackCatalog(locale);

  try {
    const database = await createClient();
    const { data: categories, error: categoriesError } = await database
      .from("product_categories")
      .select("id, code, icon_key, accent_color, position")
      .eq("is_published", true)
      .order("position");

    if (categoriesError || !categories?.length) return fallbackCatalog(locale);

    const categoryIds = categories.map(({ id }) => id);
    const [{ data: categoryTranslations, error: categoryTranslationError }, { data: products, error: productsError }, {data:dbBrands}] =
      await Promise.all([
        database
          .from("product_category_translations")
          .select("category_id, name, description, slug")
          .eq("locale", locale)
          .in("category_id", categoryIds),
        database
          .from("products")
          .select("id, brand_id, category_id, image_url, is_featured, position")
          .eq("is_published", true)
          .lte("published_at", new Date().toISOString())
          .in("category_id", categoryIds)
          .order("position"),
        database.from("brands").select("id,code").eq("is_published",true),
      ]);

    if (categoryTranslationError || productsError || !categoryTranslations) {
      return fallbackCatalog(locale);
    }

    const productIds = (products ?? []).map(({ id }) => id);
    const { data: productTranslations, error: productTranslationError } = productIds.length
      ? await database
          .from("product_translations")
          .select("product_id, name, short_description, key_specification, slug")
          .eq("locale", locale)
          .in("product_id", productIds)
      : { data: [], error: null };

    if (productTranslationError || !productTranslations) return fallbackCatalog(locale);

    const categoryCopy = new Map(
      categoryTranslations.map((translation) => [translation.category_id, translation]),
    );
    const productCopy = new Map(
      productTranslations.map((translation) => [translation.product_id, translation]),
    );

    const mapped = categories.flatMap((category) => {
      const translation = categoryCopy.get(category.id);
      if (!translation) return [];

      return [
        {
          id: category.id,
          code: category.code,
          slug: translation.slug,
          name: translation.name,
          description: translation.description ?? "",
          icon: category.icon_key,
          accentColor: category.accent_color,
          position: category.position,
          products: (products ?? []).flatMap((product) => {
            if (product.category_id !== category.id) return [];
            const copy = productCopy.get(product.id);
            if (!copy) return [];
            return [
              {
                id: product.id,
                slug: copy.slug,
                name: copy.name,
                description: copy.short_description ?? "",
                specification: copy.key_specification ?? "",
                imageUrl: product.image_url,
                featured: product.is_featured,
                position: product.position,
                brandCode: ((dbBrands?.find(brand=>brand.id===product.brand_id)?.code??"diyar-shimi") as BrandCode),
                brandName: brandName(((dbBrands?.find(brand=>brand.id===product.brand_id)?.code??"diyar-shimi") as BrandCode), locale),
              },
            ];
          }),
        },
      ];
    });

    if (!mapped.length) return fallbackCatalog(locale);
    return { categories: mapped, source: "postgres" };
  } catch {
    return fallbackCatalog(locale);
  }
}

export function featuredProducts(catalog: CatalogResult, limit = 4) {
  return catalog.categories
    .flatMap((category) =>
      category.products.map((product) => ({ ...product, category })),
    )
    .filter((product) => product.featured)
    .sort((a, b) => a.position - b.position)
    .slice(0, limit);
}

export function findCatalogProduct(catalog: CatalogResult, slug: string) {
  for (const category of catalog.categories) {
    const product = category.products.find((item) => item.slug === slug);
    if (product) return { product, category };
  }
  return null;
}

export function productFallbackImage(categoryCode: string) {
  const images: Record<string, string> = {
    "engine-oil": "/images/product-engine-oil-dst.png",
    "gear-oil": "/images/product-gear-oil-dst.png",
    "brake-fluid": "/images/product-brake-fluid-dst.png",
    antifreeze: "/images/product-antifreeze-dst.png",
  };
  return images[categoryCode] ?? "/images/product-engine-oil-dst.png";
}
