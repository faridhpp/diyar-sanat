import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContactSubmissionForm } from "@/components/contact-submission-form";
import { InnerPageHero } from "@/components/inner-page-hero";
import { isLocale } from "@/lib/i18n";
import { getManagedMetadata, getManagedTranslations } from "@/lib/site-content";
import { normalizeMapEmbed } from "@/lib/content-embeds";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const fa = lang === "fa";
  return getManagedMetadata(lang, "/contact", {
    title: fa ? "تماس با ما | دیار صنعت تبریز" : "Contact us | Diyar Sanat Tabriz",
    description: fa
      ? "اطلاعات تماس و فرم ارتباط با واحدهای دیار صنعت تبریز."
      : "Contact information and departmental inquiry form for Diyar Sanat Tabriz.",
    alternates: {
      canonical: `/${lang}/contact`,
      languages: { fa: "/fa/contact", en: "/en/contact" },
    },
  });
}

export default async function ContactPage({ params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const fa = lang === "fa";
  const managed = await getManagedTranslations(lang, "contact");
  const t = (key: string, fallback: string) => managed[key]?.trim() || fallback;
  const email = t("office.email", "info@diyarsanat.com");
  const mapSrc =
    normalizeMapEmbed(managed["map.embed_url"] ?? "") ??
    "https://www.openstreetmap.org/export/embed.html?bbox=46.18%2C38.02%2C46.38%2C38.14&layer=mapnik";

  return (
    <main id="main-content" className="business-page">
      <InnerPageHero
        locale={lang}
        current={fa ? "تماس با ما" : "Contact"}
        eyebrow={t("hero.eyebrow", fa ? "ارتباط مستقیم" : "Direct communication")}
        title={t("hero.title", fa ? "با دیار صنعت در ارتباط باشید" : "Contact Diyar Sanat")}
        description={t(
          "hero.description",
          fa
            ? "اطلاعات تماس مجموعه و مسیر ارتباط با واحدهای تخصصی را در این صفحه مشاهده کنید."
            : "Find company contact information and reach the appropriate specialist team.",
        )}
      />
      <section className="container-wide contact-information" aria-labelledby="contact-information-title">
        <div className="contact-details">
          <span>{fa ? "اطلاعات ارتباطی" : "Contact information"}</span>
          <h2 id="contact-information-title">
            {t("office.title", fa ? "دفتر دیار صنعت تبریز" : "Diyar Sanat Tabriz office")}
          </h2>
          <dl>
            <div><dt>{fa ? "ایمیل" : "Email"}</dt><dd><a href={`mailto:${email}`} dir="ltr">{email}</a></dd></div>
            <div><dt>{fa ? "تلفن" : "Phone"}</dt><dd>{t("office.phone", fa ? "در انتظار تأیید رسمی" : "Pending official verification")}</dd></div>
            <div><dt>{fa ? "نشانی" : "Address"}</dt><dd>{t("office.address", fa ? "تبریز، ایران — نشانی دقیق در انتظار تأیید" : "Tabriz, Iran — full address pending verification")}</dd></div>
          </dl>
        </div>
        <div className="contact-map">
          <iframe
            title={fa ? "نقشه موقعیت دیار صنعت" : "Diyar Sanat location map"}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
            src={mapSrc}
          />
        </div>
      </section>
      <div className="container-wide business-layout contact-form-layout">
        <aside className="business-aside">
          <span>{fa ? "مسیر پاسخ‌گویی" : "Response path"}</span>
          <h2>{fa ? "درخواست شما به واحد درست می‌رسد" : "Your request reaches the right team"}</h2>
          <ol>
            <li><strong>۱</strong><div>{fa ? "انتخاب واحد مقصد" : "Choose the team"}<small>{fa ? "فروش، فنی، منابع انسانی یا روابط عمومی" : "Sales, technical, HR, or PR"}</small></div></li>
            <li><strong>۲</strong><div>{fa ? "بررسی اطلاعات" : "Information review"}<small>{fa ? "ارزیابی موضوع و فایل پیوست" : "Review of topic and attachment"}</small></div></li>
            <li><strong>۳</strong><div>{fa ? "پاسخ از مسیر رسمی" : "Official response"}<small>{fa ? "ثبت امن و پیگیری در پنل" : "Secure storage and admin follow-up"}</small></div></li>
          </ol>
        </aside>
        <ContactSubmissionForm locale={lang} />
      </div>
    </main>
  );
}
