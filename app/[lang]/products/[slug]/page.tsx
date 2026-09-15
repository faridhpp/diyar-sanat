import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CategoryIcon, ChevronIcon, HomeIcon } from "@/components/icons";
import { ProductCard } from "@/components/product-card";
import { ProductDetailGallery } from "@/components/product-detail-gallery";
import { ProductDetailTabs } from "@/components/product-detail-tabs";
import { findCatalogProduct, getCatalog, productFallbackImage } from "@/lib/catalog";
import { createClient } from "@/lib/db/server";
import { getDictionary, isLocale } from "@/lib/i18n";
import { getManagedTranslations } from "@/lib/site-content";

type Props = { params: Promise<{ lang: string; slug: string }> };
type GalleryRow = { file_url: string; alt_fa: string; alt_en: string; is_primary: boolean };
type FeatureRow = { icon_key: string; title_fa: string; title_en: string; description_fa: string | null; description_en: string | null };
type ApplicationRow = { title_fa: string; title_en: string; description_fa: string | null; description_en: string | null };
type SpecRow = { label: string; value: string };
type DownloadRow = { file_url: string; title_fa: string; title_en: string; file_type: string };

function localizedHref(href: string, lang: "fa" | "en") {
  const value = href.trim();
  if (!value) return "";
  if (/^(https:\/\/|mailto:|tel:|#)/.test(value)) return value;
  if (value === `/${lang}` || value.startsWith(`/${lang}/`)) return value;
  if (value.startsWith("/")) return `/${lang}${value === "/" ? "" : value}`;
  return "";
}

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

  let gallery: GalleryRow[] = [];
  let features: FeatureRow[] = [];
  let applications: ApplicationRow[] = [];
  let specifications: SpecRow[] = [];
  let downloads: DownloadRow[] = [];
  let landing: Record<string, string> = {};

  if (product.id > 0) {
    const db = await createClient();
    const [galleryResult, featureResult, applicationResult, specificationResult, downloadResult, managedLanding] = await Promise.all([
      db.from("product_images").select("file_url,alt_fa,alt_en,is_primary").eq("product_id", product.id).order("position"),
      db.from("product_features").select("icon_key,title_fa,title_en,description_fa,description_en").eq("product_id", product.id).order("position"),
      db.from("product_applications").select("title_fa,title_en,description_fa,description_en").eq("product_id", product.id).order("position"),
      db.from("product_specifications").select("label,value").eq("product_id", product.id).eq("locale", lang).order("position"),
      db.from("product_downloads").select("file_url,title_fa,title_en,file_type").eq("product_id", product.id).order("position"),
      getManagedTranslations(lang, `product-${product.id}`),
    ]);
    gallery = (galleryResult.data ?? []) as GalleryRow[];
    features = (featureResult.data ?? []) as FeatureRow[];
    applications = (applicationResult.data ?? []) as ApplicationRow[];
    specifications = (specificationResult.data ?? []) as SpecRow[];
    downloads = (downloadResult.data ?? []) as DownloadRow[];
    landing = managedLanding;
  }

  const managed = (key: string) => landing[key]?.trim() ?? "";
  const mainImage = product.imageUrl ?? productFallbackImage(category.code);
  const related = catalog.categories
    .flatMap((item) => item.products.map((entry) => ({ product: entry, category: item })))
    .filter((item) => item.product.slug !== slug)
    .slice(0, 4);

  const primaryLabel = managed("cta.primary.label");
  const primaryHref = localizedHref(managed("cta.primary.href"), lang);
  const secondaryLabel = managed("cta.secondary.label");
  const secondaryHref = localizedHref(managed("cta.secondary.href"), lang);
  const relatedTitle = managed("related.title");
  const relatedEyebrow = managed("related.eyebrow");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: mainImage.startsWith("http") ? mainImage : `https://diyarsanat.com${mainImage}`,
    brand: { "@type": "Brand", name: product.brandName },
    category: category.name,
  };

  return (
    <main id="main-content" className="product-detail-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <nav className="product-detail-breadcrumb">
        <div className="container-wide">
          <Link href={`/${lang}`}><HomeIcon className="size-4" />{dict.navigation.home}</Link>
          <ChevronIcon className="directional-icon size-4" />
          <Link href={`/${lang}/products`}>{dict.navigation.products}</Link>
          <ChevronIcon className="directional-icon size-4" />
          <span>{product.name}</span>
        </div>
      </nav>

      <section className="container-wide product-detail-hero">
        <div className="product-detail-copy">
          {managed("hero.badge") ? <span className="product-made-in">{managed("hero.badge")}</span> : null}
          <span className={`product-detail-brand brand-${product.brandCode}`}>
            {managed("hero.brand_label") ? <small>{managed("hero.brand_label")}</small> : null}
            <strong dir="ltr">{product.brandName}</strong>
          </span>
          <span className="eyebrow">{category.name}</span>
          <h1>{product.name}</h1>
          {product.specification ? <strong dir="ltr">{product.specification}</strong> : null}
          <p>{product.description}</p>

          {features.length ? (
            <div className="product-benefits">
              {features.map((item, index) => (
                <div key={`${item.icon_key}-${index}`}>
                  <span><CategoryIcon name={item.icon_key} className="size-6" /></span>
                  <small>{fa ? item.title_fa : item.title_en}</small>
                </div>
              ))}
            </div>
          ) : null}

          <dl className="product-spec-card">
            {managed("spec.category_label") ? <div><dt>{managed("spec.category_label")}</dt><dd>{category.name}</dd></div> : null}
            {managed("spec.key_label") && product.specification ? <div><dt>{managed("spec.key_label")}</dt><dd dir="ltr">{product.specification}</dd></div> : null}
            {managed("spec.brand_label") ? <div><dt>{managed("spec.brand_label")}</dt><dd>{product.brandName}</dd></div> : null}
            {managed("spec.origin_label") && managed("origin.value") ? <div><dt>{managed("spec.origin_label")}</dt><dd>{managed("origin.value")}</dd></div> : null}
          </dl>
        </div>

        <div className="product-detail-visual">
          <ProductDetailGallery images={gallery.length ? gallery.map((item) => item.file_url) : [mainImage]} name={product.name} />
          {(primaryLabel && primaryHref) || (secondaryLabel && secondaryHref) ? (
            <div className="product-detail-actions">
              {primaryLabel && primaryHref ? <Link className="button button-primary" href={primaryHref}>{primaryLabel}</Link> : null}
              {secondaryLabel && secondaryHref ? <Link className="button button-secondary" href={secondaryHref}>{secondaryLabel}</Link> : null}
            </div>
          ) : null}
        </div>
      </section>

      <div className="container-wide">
        <ProductDetailTabs
          locale={lang}
          description={product.description}
          category={category.name}
          applications={applications.map((item) => ({ title: fa ? item.title_fa : item.title_en, description: (fa ? item.description_fa : item.description_en) ?? "" }))}
          features={features.map((item) => ({ title: fa ? item.title_fa : item.title_en, description: (fa ? item.description_fa : item.description_en) ?? "" }))}
          specifications={specifications}
          downloads={downloads.map((item) => ({ title: fa ? item.title_fa : item.title_en, url: item.file_url, type: item.file_type }))}
        />

        {related.length && relatedTitle ? (
          <section className="related-products">
            <header>{relatedEyebrow ? <span>{relatedEyebrow}</span> : null}<h2>{relatedTitle}</h2></header>
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
