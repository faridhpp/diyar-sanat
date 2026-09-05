import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CategoryIcon, ChevronIcon, HomeIcon } from "@/components/icons";
import { ProductCard } from "@/components/product-card";
import { ProductDetailGallery } from "@/components/product-detail-gallery";
import { ProductDetailTabs } from "@/components/product-detail-tabs";
import {
  findCatalogProduct,
  getCatalog,
  productFallbackImage,
} from "@/lib/catalog";
import { getDictionary, isLocale } from "@/lib/i18n";
import { createClient } from "@/lib/db/server";

type Props = { params: Promise<{ lang: string; slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLocale(lang)) return {};
  const found = findCatalogProduct(await getCatalog(lang), slug);
  if (!found) return {};
  return {
    title: `${found.product.name} | ${lang === "fa" ? "محصولات دیار شیمی" : "Diyar Shimi products"}`,
    description: found.product.description,
    alternates: { canonical: `/${lang}/products/${slug}` },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { lang, slug } = await params;
  if (!isLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const catalog = await getCatalog(lang);
  const found = findCatalogProduct(catalog, slug);
  if (!found) notFound();
  const { product, category } = found;
  const fa = lang === "fa";
  const db = await createClient();
  const [{data:gallery=[]},{data:features=[]},{data:applications=[]},{data:specifications=[]},{data:downloads=[]}] = product.id > 0 ? await Promise.all([
    db.from("product_images").select("file_url,alt_fa,alt_en,is_primary").eq("product_id",product.id).order("position"),
    db.from("product_features").select("icon_key,title_fa,title_en,description_fa,description_en").eq("product_id",product.id).order("position"),
    db.from("product_applications").select("title_fa,title_en,description_fa,description_en").eq("product_id",product.id).order("position"),
    db.from("product_specifications").select("label,value").eq("product_id",product.id).eq("locale",lang).order("position"),
    db.from("product_downloads").select("file_url,title_fa,title_en,file_type").eq("product_id",product.id).order("position"),
  ]) : [{data:[]},{data:[]},{data:[]},{data:[]},{data:[]}];
  const mainImage = product.imageUrl ?? productFallbackImage(category.code);
  const jpgImage = productFallbackImage(category.code).replace(".png", ".jpg");
  const related = catalog.categories
    .flatMap((item) =>
      item.products.map((entry) => ({ product: entry, category: item })),
    )
    .filter((item) => item.product.slug !== slug)
    .slice(0, 4);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: mainImage.startsWith("http")
      ? mainImage
      : `https://diyarsanat.com${mainImage}`,
    brand: { "@type": "Brand", name: product.brandName },
    category: category.name,
  };
  return (
    <main id="main-content" className="product-detail-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <nav className="product-detail-breadcrumb">
        <div className="container-wide">
          <Link href={`/${lang}`}>
            <HomeIcon className="size-4" />
            {dict.navigation.home}
          </Link>
          <ChevronIcon className="directional-icon size-4" />
          <Link href={`/${lang}/products`}>{dict.navigation.products}</Link>
          <ChevronIcon className="directional-icon size-4" />
          <span>{product.name}</span>
        </div>
      </nav>
      <section className="container-wide product-detail-hero">
        <div className="product-detail-copy">
          <span className="product-made-in">
            {fa ? "ساخت ایران" : "Made in Iran"}
          </span>
          <span className={`product-detail-brand brand-${product.brandCode}`}>
            <small>{fa ? "برند محصول" : "Product brand"}</small>
            <strong dir="ltr">{product.brandName}</strong>
          </span>
          <span className="eyebrow">{category.name}</span>
          <h1>{product.name}</h1>
          <strong dir="ltr">{product.specification}</strong>
          <p>{product.description}</p>
          <div className="product-benefits">
            {(features?.length ? features.map(item=>({i:item.icon_key,fa:item.title_fa,en:item.title_en})) : [
              { i: "shield", fa: "رویکرد محافظتی", en: "Protection focused" },
              { i: "droplet", fa: "عملکرد پایدار", en: "Stable performance" },
              { i: "gear", fa: "کاربرد تخصصی", en: "Specialist application" },
              { i: "snowflake", fa: "سبد خودرویی", en: "Automotive portfolio" },
            ]).map((item) => (
              <div key={item.i}>
                <span>
                  <CategoryIcon name={item.i} className="size-6" />
                </span>
                <small>{fa ? item.fa : item.en}</small>
              </div>
            ))}
          </div>
          <dl className="product-spec-card">
            <div>
              <dt>{fa ? "گروه محصول" : "Category"}</dt>
              <dd>{category.name}</dd>
            </div>
            <div>
              <dt>{fa ? "مشخصه کلیدی" : "Key specification"}</dt>
              <dd dir="ltr">{product.specification}</dd>
            </div>
            <div>
              <dt>{fa ? "برند" : "Brand"}</dt>
              <dd>{product.brandName}</dd>
            </div>
            <div>
              <dt>{fa ? "کشور سازنده" : "Country of origin"}</dt>
              <dd>{fa ? "ایران" : "Iran"}</dd>
            </div>
          </dl>
        </div>
        <div className="product-detail-visual">
          <ProductDetailGallery
            images={gallery?.length ? gallery.map(item=>item.file_url) : [mainImage, jpgImage]}
            name={product.name}
          />
          <div className="product-detail-actions">
            <Link className="button button-primary" href={`/${lang}/contact`}>
              {fa ? "استعلام و مشاوره خرید" : "Request pricing and advice"}
            </Link>
            <Link
              className="button button-secondary"
              href={`/${lang}/products`}
            >
                {fa ? "مشاهده همه محصولات" : "View all products"}
            </Link>
          </div>
        </div>
      </section>
      <div className="container-wide">
        <ProductDetailTabs
          locale={lang}
          description={product.description}
          category={category.name}
          applications={(applications??[]).map(item=>({title:fa?item.title_fa:item.title_en,description:(fa?item.description_fa:item.description_en)??""}))}
          features={(features??[]).map(item=>({title:fa?item.title_fa:item.title_en,description:(fa?item.description_fa:item.description_en)??""}))}
          specifications={specifications??[]}
          downloads={(downloads??[]).map(item=>({title:fa?item.title_fa:item.title_en,url:item.file_url,type:item.file_type}))}
        />
        {related.length ? (
          <section className="related-products">
            <header>
              <span>{fa ? "پیشنهادهای دیگر" : "More products"}</span>
              <h2>{fa ? "محصولات مرتبط" : "Related products"}</h2>
            </header>
            <div className="product-grid">
              {related.map((item) => (
                <ProductCard
                  key={item.product.id}
                  locale={lang}
                  name={item.product.name}
                  description={item.product.description}
                  specification={item.product.specification}
                  slug={item.product.slug}
                  imageUrl={item.product.imageUrl}
                  icon={item.category.icon}
                  categoryCode={item.category.code}
                  accentColor={item.category.accentColor}
                  detailsLabel={dict.actions.details}
                  brandCode={item.product.brandCode}
                  brandName={item.product.brandName}
                />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
