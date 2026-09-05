import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fontClassFor } from "@/app/fonts";
import { MobileNavigation } from "@/components/mobile-navigation";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { directionFor, getDictionary, isLocale, locales } from "@/lib/i18n";
import { createClient } from "@/lib/db/server";
import "../globals.css";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = getDictionary(lang);
  const {data:settings}=await(await createClient()).from("site_settings").select("site_title_fa,site_title_en,site_description_fa,site_description_en,favicon_url,google_site_verification,default_og_image_url").eq("id",true).maybeSingle();
  const title = (lang === "fa" ? settings?.site_title_fa : settings?.site_title_en) || (lang === "fa" ? "دیار صنعت تبریز" : "Diyar Sanat Tabriz");
  const description = (lang === "fa" ? settings?.site_description_fa : settings?.site_description_en) || (lang === "fa"
    ? "وب‌سایت رسمی دیار صنعت تبریز و برند دیار شیمی؛ تولیدکننده روانکارها و سیالات تخصصی خودرو."
    : "Official website of Diyar Sanat Tabriz and Diyar Shimi automotive lubricants and specialty fluids.");

  return {
    metadataBase: new URL("https://diyarsanat.com"),
    title: { default: title, template: `%s | ${title}` },
    description,
    applicationName: dict.brandName,
    icons: settings?.favicon_url ? {icon:settings.favicon_url} : undefined,
    verification: settings?.google_site_verification ? {google:settings.google_site_verification} : undefined,
    alternates: {
      canonical: `/${lang}`,
      languages: { fa: "/fa", en: "/en" },
    },
    openGraph: {
      type: "website",
      locale: lang === "fa" ? "fa_IR" : "en_US",
      siteName: title,
      title,
      description,
      images: [{
        url: settings?.default_og_image_url || "/images/diyar-social-card.png",
        width: 1731,
        height: 909,
        alt: lang === "fa" ? "دیار صنعت تبریز؛ ساخت ایران، حرکت به جلو" : "Diyar Sanat Tabriz — Made in Iran, moving forward",
      }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [settings?.default_og_image_url || "/images/diyar-social-card.png"],
    },
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  return (
    <html lang={lang} dir={directionFor(lang)} suppressHydrationWarning>
      <body className={fontClassFor(lang)} suppressHydrationWarning>
        <a className="skip-link" href="#main-content">
          {lang === "fa" ? "پرش به محتوای اصلی" : "Skip to main content"}
        </a>
        <SiteHeader locale={lang} />
        {children}
        <SiteFooter locale={lang} />
        <MobileNavigation locale={lang} />
      </body>
    </html>
  );
}
