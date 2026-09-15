import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronIcon, HomeIcon } from "@/components/icons";
import { isLocale } from "@/lib/i18n";
import { getMediaArticlesFromDatabase, mediaKindLabel } from "@/lib/media-content";

type Props = { params: Promise<{ lang: string; slug: string }> };

const absoluteMediaUrl = (url: string) =>
  /^https?:\/\//.test(url) ? url : `https://diyarsanat.com${url.startsWith("/") ? url : `/${url}`}`;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLocale(lang)) return {};
  const articles = await getMediaArticlesFromDatabase(lang);
  const article = articles.find((item) => item.slug === slug);
  if (!article) return {};
  return {
    title: `${article.title} | ${lang === "fa" ? "مجله دیار صنعت" : "Diyar Sanat journal"}`,
    description: article.excerpt,
    alternates: { canonical: `/${lang}/media/${slug}` },
    openGraph: {
      type: "article",
      title: article.title,
      description: article.excerpt,
      images: [{ url: absoluteMediaUrl(article.image) }],
      publishedTime: article.date,
      section: mediaKindLabel(lang, article.kind),
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.excerpt,
      images: [absoluteMediaUrl(article.image)],
    },
  };
}

export default async function MediaArticlePage({ params }: Props) {
  const { lang, slug } = await params;
  if (!isLocale(lang)) notFound();
  const articles = await getMediaArticlesFromDatabase(lang);
  const article = articles.find((item) => item.slug === slug);
  if (!article) notFound();
  const fa = lang === "fa";
  const related = articles.filter((item) => item.slug !== slug).slice(0, 3);
  const articleUrl = `https://diyarsanat.com/${lang}/media/${slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": article.kind === "news" ? "NewsArticle" : "Article",
    headline: article.title,
    description: article.excerpt,
    image: absoluteMediaUrl(article.image),
    datePublished: article.date,
    dateModified: article.date,
    author: { "@type": "Organization", name: "Diyar Sanat Tabriz" },
    publisher: {
      "@type": "Organization",
      name: "Diyar Sanat Tabriz",
      url: "https://diyarsanat.com",
    },
    mainEntityOfPage: articleUrl,
  };

  return (
    <main id="main-content" className="media-article-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <nav className="article-breadcrumb">
        <div className="container-wide">
          <Link href={`/${lang}`}>
            <HomeIcon className="size-4" />
            {fa ? "خانه" : "Home"}
          </Link>
          <ChevronIcon className="directional-icon size-4" />
          <Link href={`/${lang}/media`}>{fa ? "رسانه" : "Media"}</Link>
          <ChevronIcon className="directional-icon size-4" />
          <span>{article.title}</span>
        </div>
      </nav>
      <article>
        <header className="article-hero">
          <div className="container-wide">
            <span className="article-kind">{mediaKindLabel(lang, article.kind)}</span>
            <h1>{article.title}</h1>
            <p>{article.excerpt}</p>
            <div className="article-meta">
              <time dateTime={article.date}>
                {new Intl.DateTimeFormat(fa ? "fa-IR" : "en-US", { dateStyle: "long" }).format(
                  new Date(`${article.date}T12:00:00Z`),
                )}
              </time>
              <span>•</span>
              <small>{article.readingTime} {fa ? "دقیقه مطالعه" : "min read"}</small>
              <span>•</span>
              <small>{fa ? "تحریریه دیار صنعت" : "Diyar Sanat editorial"}</small>
            </div>
          </div>
        </header>
        <div className="container-wide article-cover">
          <Image src={article.image} alt={article.title} fill priority sizes="(max-width:800px) 100vw, 1100px" />
        </div>
        <div className="container-wide article-layout">
          <aside className="article-aside">
            <strong>{fa ? "در این مطلب" : "In this article"}</strong>
            {article.sections
              .filter((section) => section.heading)
              .map((section) => (
                <a key={section.heading} href={`#${section.heading?.replaceAll(" ", "-")}`}>
                  {section.heading}
                </a>
              ))}
            <Link href={`/${lang}/contact`}>{fa ? "پرسش از واحد فنی" : "Ask the technical team"}</Link>
          </aside>
          <div className="article-body">
            {article.sections.map((section, index) => (
              <section id={section.heading?.replaceAll(" ", "-")} key={`${section.heading}-${index}`}>
                {section.heading ? <h2>{section.heading}</h2> : null}
                {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                {section.points ? <ul>{section.points.map((point) => <li key={point}>{point}</li>)}</ul> : null}
              </section>
            ))}
            {article.videoUrl ? (
              <section className="article-video">
                <h2>{fa ? "ویدیوی مرتبط" : "Related video"}</h2>
                <video controls preload="metadata" poster={article.image}><source src={article.videoUrl} /></video>
              </section>
            ) : null}
            <aside className="article-cta">
              <span>{fa ? "نیاز به راهنمایی محصول دارید؟" : "Need product guidance?"}</span>
              <h2>{fa ? "پیش از انتخاب، با واحد تخصصی گفت‌وگو کنید" : "Talk to our specialist team before choosing"}</h2>
              <p>{fa ? "انتخاب نهایی باید با مشخصات خودرو و دیتاشیت تأییدشده محصول هماهنگ باشد." : "Final selection should match vehicle requirements and the approved product datasheet."}</p>
              <Link className="button button-primary" href={`/${lang}/contact`}>{fa ? "درخواست مشاوره" : "Request advice"}</Link>
            </aside>
          </div>
        </div>
      </article>
      <section className="container-wide article-related">
        <header><span>{fa ? "ادامه مطالعه" : "Continue reading"}</span><h2>{fa ? "مطالب مرتبط" : "Related articles"}</h2></header>
        <div>
          {related.map((item) => (
            <article key={item.slug}>
              <Link href={`/${lang}/media/${item.slug}`}>
                <span className="related-image"><Image src={item.image} alt="" fill sizes="320px" /></span>
                <small>{mediaKindLabel(lang, item.kind)}</small>
                <h3>{item.title}</h3>
                <p>{item.excerpt}</p>
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
