import Link from "next/link";
import { Suspense } from "react";
import { BrandMark } from "@/components/brand-mark";
import { HeaderNavigation } from "@/components/header-navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { SiteSearch } from "@/components/site-search";
import { MobileMenu } from "@/components/mobile-menu";
import { LocaleSwitcher } from "@/components/locale-switcher";
import type { Locale } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n";
import { getHeaderNavigation } from "@/lib/navigation";
import { createClient } from "@/lib/db/server";

export async function SiteHeader({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const db = await createClient();
  const [nav, { data: settings }] = await Promise.all([
    getHeaderNavigation(locale),
    db
      .from("site_settings")
      .select("site_title_fa,site_title_en,header_logo_url")
      .eq("id", true)
      .maybeSingle(),
  ]);
  const title = locale === "fa" ? settings?.site_title_fa : settings?.site_title_en;

  return (
    <header className="site-header">
      <div className="container-wide header-main">
        <BrandMark locale={locale} logoUrl={settings?.header_logo_url} title={title} />
        <Suspense fallback={<nav className="desktop-nav" aria-hidden="true" />}>
          <HeaderNavigation
            items={nav}
            label={locale === "fa" ? "ناوبری اصلی" : "Primary navigation"}
          />
        </Suspense>
        <div className="header-tools">
          <MobileMenu
            locale={locale}
            items={nav}
            logoUrl={settings?.header_logo_url}
            brandTitle={title}
          />
          <LocaleSwitcher locale={locale} />
          <ThemeToggle lightLabel={dict.theme.light} darkLabel={dict.theme.dark} />
          <SiteSearch locale={locale} />
          <Link
            className="representative-button"
            href={`/${locale}/representative-application`}
            dir={locale === "fa" ? "rtl" : "ltr"}
          >
            {dict.actions.representative}
          </Link>
        </div>
      </div>
    </header>
  );
}
