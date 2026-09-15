import Image from "next/image";
import Link from "next/link";
import {
  CategoryIcon,
  ChevronIcon,
  FlaskIcon,
  GearIcon,
  HeadsetIcon,
  ShieldIcon,
  UserIcon,
} from "@/components/icons";
import { IranMapMark } from "@/components/iran-map-mark";
import { featuredProducts, getCatalog, productFallbackImage } from "@/lib/catalog";
import { brands } from "@/lib/brands";
import { getDictionary, isLocale } from "@/lib/i18n";
import { getMediaArticlesFromDatabase, mediaKindLabel } from "@/lib/media-content";
import { notFound } from "next/navigation";
import { getManagedTranslations } from "@/lib/site-content";
import { createClient } from "@/lib/db/server";
import { HomepageHero, type HomeSlide } from "@/components/homepage-hero";

export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const [catalog, managed, mediaArticles] = await Promise.all([
    getCatalog(lang),
    getManagedTranslations(lang, "home"),
    getMediaArticlesFromDatabase(lang),
  ]);
  const t = (key: string, fallback: string) => managed[key]?.trim() || fallback;
  const fa = lang === "fa";
  const db = await createClient();
  const [{ data: heroRows = [] }, { data: homeVideo }] = await Promise.all([
    db.from("homepage_hero_slides").select("*").eq("is_published", true).order("position"),
    db.from("homepage_video").select("*").eq("id", true).eq("is_published", true).maybeSingle(),
  ]);
  const managedSlides: HomeSlide[] = (heroRows ?? []).map((row) => ({
    id: row.id,
    image_url: row.image_url,
    alt: fa ? row.alt_fa : row.alt_en,
    kicker: fa ? row.kicker_fa : row.kicker_en,
    title: fa ? row.title_fa : row.title_en,
    subtitle: (fa ? row.subtitle_fa : row.subtitle_en) ?? "",
    description: (fa ? row.description_fa : row.description_en) ?? "",
    primaryLabel: (fa ? row.primary_label_fa : row.primary_label_en) ?? "",
    primaryHref: row.primary_href,
    secondaryLabel: (fa ? row.secondary_label_fa : row.secondary_label_en) ?? "",
    secondaryHref: row.secondary_href ?? "#factory",
  }));
  const slides = managedSlides.length
    ? managedSlides
    : [
        {
          id: -1,
          image_url: "/images/industrial-hero.webp",
          alt: dict.hero.sampleImage,
          kicker: t("hero.kicker", dict.hero.titleLead),
          title: t("hero.title", dict.hero.titleAccent),
          subtitle: t("hero.subtitle", dict.hero.eyebrow),
          description: t("hero.description", dict.hero.description),
          primaryLabel: dict.actions.viewProducts,
          primaryHref: "/products",
          secondaryLabel: dict.actions.aboutFactory,
          secondaryHref: "#factory",
        },
      ];

  const featured = featuredProducts(catalog, 4);
  const featuredIds = new Set(featured.map((item) => item.id));
  const remainingProducts = catalog.categories
    .flatMap((category) => category.products.map((product) => ({ ...product, category })))
    .filter((product) => !featuredIds.has(product.id))
    .sort((a, b) => a.position - b.position);
  const homepageProducts = [...featured, ...remainingProducts].slice(0, 4);
  const homepageMedia = mediaArticles.slice(0, 4);

  const metrics = [
    [fa ? "۴ گروه محصول" : "4 product groups", fa ? "سبد تخصصی محصولات خودرو" : "Specialist automotive range", FlaskIcon, "red"],
    [fa ? "تولید در تبریز" : "Made in Tabriz", fa ? "تولید ایرانی، نگاه رو به جلو" : "Iranian production, forward-looking", GearIcon, "navy"],
    [fa ? "کنترل مرحله‌ای" : "Process control", fa ? "پایش منظم فرایند تولید" : "Structured production monitoring", ShieldIcon, "blue"],
    [fa ? "پشتیبانی تخصصی" : "Specialist support", fa ? "پاسخ‌گویی فنی محصولات" : "Technical product guidance", UserIcon, "amber"],
    [fa ? "چشم‌انداز توسعه" : "Growth outlook", fa ? "در مسیر بازارهای گسترده‌تر" : "Growing toward wider markets", IranMapMark, "green"],
  ] as const;
  const credentials = [
    [fa ? "استاندارد ملی ایران" : "Iran National Standard", "338", "national"],
    [fa ? "استاندارد بین‌المللی" : "International standard", "ASTM D3306", "international"],
    [fa ? "شماره استاندارد" : "Standard number", "10001517", "standard"],
    [fa ? "پروانه بهره‌برداری" : "Operating license", "7206290", "license"],
    [fa ? "شماره کسب‌وکار" : "Business number", "12452916074", "business"],
  ] as const;

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: dict.brandName,
    url: `https://diyarsanat.com/${lang}`,
    email: "info@diyarsanat.com",
    address: { "@type": "PostalAddress", addressLocality: "Tabriz", addressCountry: "IR" },
  };

  return (
    <main id="main-content" className="home-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd).replace(/</g, "\\u003c") }}
      />

      <HomepageHero
        locale={lang}
        slides={slides}
        badgeTitle={t("hero.badge_title", fa ? "ساخت ایران" : "Made in Iran")}
        badgeSubtitle={t("hero.badge_subtitle", fa ? "حرکت به جلو" : "Moving forward")}
      />

      <section className="metrics-wrap" aria-label={fa ? "شاخص‌های دیار صنعت" : "Diyar Sanat highlights"}>
        <ul className="metrics-panel" role="list">
          {metrics.map(([title, body, Icon, tone]) => (
            <li className={`metric-item metric-tone-${tone}`} key={title}>
              <span className="metric-icon" aria-hidden="true"><Icon className="size-7" /></span>
              <span className="metric-copy"><strong>{title}</strong><small>{body}</small></span>
            </li>
          ))}
        </ul>
      </section>

      <section className="products-showcase section-space">
        <div className="container-wide">
          <div className="products-heading">
            <span>{t("products.eyebrow", fa ? "محصولات ما" : "Our products")}</span>
            <h2>{t("products.title", fa ? "راهکارهای تخصصی برای عملکرد بهتر" : "Specialist solutions for better performance")}</h2>
          </div>
          {homepageProducts.length ? (
            <div className="category-grid">
              {homepageProducts.map((product, index) => (
                <article key={product.id} className={`category-card product-tone-${index + 1}`}>
                  <div className="product-art">
                    <Image
                      src={product.imageUrl ?? productFallbackImage(product.category.code)}
                      alt={product.name}
                      fill
                      sizes="(max-width: 800px) 78vw, 300px"
                    />
                  </div>
                  <div className="category-card-copy">
                    <span className="product-category-icon">
                      <CategoryIcon name={product.category.icon} className="size-5" />
                    </span>
                    <h3>{product.name}</h3>
                    {product.specification ? (
                      <strong dir="ltr" style={{ color: "var(--red)", fontSize: "12px", marginBottom: "8px" }}>
                        {product.specification}
                      </strong>
                    ) : null}
                    <p>{product.description || product.category.description}</p>
                    <Link href={`/${lang}/products/${product.slug}`}>
                      {fa ? "مشاهده محصول" : "View product"}
                      <span><ChevronIcon className="directional-icon size-4" /></span>
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="empty-state">{fa ? "محصول منتشرشده‌ای برای نمایش وجود ندارد." : "No published products are available."}</p>
          )}
          <Link className="button all-products" href={`/${lang}/products`}>
            {fa ? "مشاهده همه محصولات" : "View all products"}
            <span><ChevronIcon className="directional-icon size-4" /></span>
          </Link>
        </div>
      </section>

      <section className="brands-section section-space" aria-labelledby="brands-title">
        <div className="container-wide">
          <div className="brands-heading">
            <span>{t("brands.eyebrow", fa ? "خانواده برندهای دیار صنعت" : "Diyar Sanat brand family")}</span>
            <h2 id="brands-title">{t("brands.title", fa ? "برندهای ما" : "Our brands")}</h2>
            <p>{t("brands.description", fa ? "سه هویت مستقل در مسیر توسعه سبد روانکارها و سیالات خودرویی" : "Three distinct identities shaping our automotive fluids portfolio")}</p>
          </div>
          <div className="brand-grid">
            {brands.map((brand) => {
              const localizedName = fa ? brand.fa : brand.en;
              return (
                <Link className={`brand-card brand-${brand.code}`} href={`/${lang}/products?brand=${brand.code}`} key={brand.code}>
                  <span className="brand-card-watermark" aria-hidden="true">{fa ? "دیار صنعت" : "Diyar Sanat"}</span>
                  <div className="brand-card-identity">
                    <strong className="brand-wordmark" dir="ltr">{brand.latin}</strong>
                    <h3>{localizedName}</h3>
                  </div>
                  <p>{fa ? `محصولات تخصصی برند ${localizedName} در حوزه روانکارها و سیالات خودرویی` : `${localizedName} specialist automotive lubricants and fluids`}</p>
                  <span className="brand-card-link">{fa ? `محصولات برند ${localizedName}` : `${localizedName} products`}<span><ChevronIcon className="directional-icon size-4" /></span></span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section id="factory" className="factory-section section-space">
        <div className="container-wide factory-panel">
          <div className="factory-copy">
            <span className="factory-kicker">{t("factory.eyebrow", fa ? "درباره مجموعه" : "Inside the company")}</span>
            <h2>{t("factory.title", fa ? "دیار صنعت تبریز" : "Diyar Sanat Tabriz")}</h2>
            <p>{t("factory.description", dict.factory.body)}</p>
            <Link className="button button-secondary" href={`/${lang}#contact`}>{dict.actions.more}</Link>
          </div>
          <div className="factory-teaser" aria-label={fa ? "کاور تیزر معرفی کارخانه دیار صنعت تبریز" : "Diyar Sanat Tabriz factory teaser cover"}>
            <Image src={homeVideo?.cover_url || "/images/factory-teaser-cover.png"} alt={fa ? "نمای سینمایی خط تولید و کارخانه دیار صنعت" : "Cinematic view of the Diyar Sanat production line and factory"} fill sizes="(max-width: 800px) 100vw, 68vw" />
            {homeVideo?.video_url ? <video className="factory-managed-video" controls preload="metadata" poster={homeVideo.cover_url ?? undefined}><source src={homeVideo.video_url} /></video> : null}
            <div className="factory-teaser-shade" aria-hidden="true" />
            <div className="teaser-caption"><span>{(fa ? homeVideo?.title_fa : homeVideo?.title_en) || (fa ? "تیزر معرفی کارخانه" : "Factory introduction")}</span><strong>{(fa ? homeVideo?.subtitle_fa : homeVideo?.subtitle_en) || (fa ? "از تولید دقیق تا حرکت رو به جلو" : "From precise production to moving forward")}</strong></div>
            <span className="teaser-play" aria-hidden="true"><i /></span>
            <div className="teaser-controls" aria-hidden="true"><span className="teaser-progress"><i /></span><small dir="ltr">00:00</small></div>
          </div>
          <div className="factory-values">
            {dict.trust.map(([title, body], index) => {
              const Icon = [ShieldIcon, FlaskIcon, GearIcon, HeadsetIcon][index];
              return <article key={title}><span><Icon className="size-7" /></span><div><h3>{title}</h3><p>{body}</p></div></article>;
            })}
          </div>
        </div>
      </section>

      <section id="media" className="media-section section-space">
        <div className="container-wide">
          <div className="section-heading-row">
            <div><span>{t("media.eyebrow", fa ? "مجله دیار صنعت" : "Diyar Sanat journal")}</span><h2>{t("media.title", fa ? "اخبار و تازه‌ها" : "News & insights")}</h2><p>{t("media.description", fa ? "تازه‌ترین مطالب تخصصی، رویدادها و راهنماهای مرتبط با محصولات" : "The latest technical articles, events, and product guidance")}</p></div>
          </div>
          {homepageMedia.length ? (
            <div className="media-grid">
              {homepageMedia.map((article, index) => (
                <article className={index === 0 ? "media-featured" : "media-compact"} key={article.slug}>
                  <Link className="media-cover" href={`/${lang}/media/${article.slug}`} aria-label={article.title}>
                    <Image src={article.image} alt="" fill sizes={index === 0 ? "(max-width: 800px) 88vw, 58vw" : "(max-width: 800px) 72vw, 240px"} />
                    <span>{mediaKindLabel(lang, article.kind)}</span>
                  </Link>
                  <div className="media-card-copy">
                    <div className="media-meta">
                      <time dateTime={article.date}>{new Intl.DateTimeFormat(fa ? "fa-IR" : "en-US", { dateStyle: "medium" }).format(new Date(`${article.date}T12:00:00Z`))}</time>
                      <span aria-hidden="true" />
                      <small>{article.readingTime} {fa ? "دقیقه مطالعه" : "min read"}</small>
                    </div>
                    <h3>{article.title}</h3>
                    <Link href={`/${lang}/media/${article.slug}`}>{fa ? "مطالعه مطلب" : "Read article"}<span><ChevronIcon className="directional-icon size-4" /></span></Link>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
          <Link className="media-more" href={`/${lang}/media`}>{fa ? "مشاهده همه اخبار و مقالات" : "View all news and articles"}<span><ChevronIcon className="directional-icon size-4" /></span></Link>
        </div>
      </section>

      <section id="certificates" className="certificate-strip section-space">
        <div className="container-wide certificate-panel">
          <div className="certificate-copy"><span>{dict.navigation.certificates}</span><h2>{t("certificates.title", fa ? "مجوزها و استانداردهای مجموعه" : "Company licenses and standards")}</h2><p>{t("certificates.description", fa ? "شناسه‌های ثبتی و استانداردهای اعلام‌شده دیار صنعت تبریز" : "Declared registrations and standards of Diyar Sanat Tabriz")}</p></div>
          <ul className="certificate-list" role="list">{credentials.map(([title, value, tone]) => <li className={`credential-${tone}`} key={value}><span className="credential-icon"><ShieldIcon className="size-6" /></span><span className="credential-copy"><small>{title}</small><strong dir="ltr">{value}</strong></span></li>)}</ul>
        </div>
      </section>
    </main>
  );
}
