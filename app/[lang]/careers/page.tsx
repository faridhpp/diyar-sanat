import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CareerList } from "@/components/career-list";
import { CareerResumeForm as ResumeForm } from "@/components/career-resume-form";
import { InnerPageHero } from "@/components/inner-page-hero";
import { isLocale } from "@/lib/i18n";
import { createClient } from "@/lib/db/server";

type Props = { params: Promise<{ lang: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const fa = lang === "fa";
  return {
    title: fa
      ? "فرصت‌های شغلی | دیار صنعت تبریز"
      : "Careers | Diyar Sanat Tabriz",
    description: fa
      ? "مشاهده فرصت‌های شغلی و ارسال رزومه عمومی برای همکاری آینده با دیار صنعت تبریز."
      : "Explore career opportunities and submit a general résumé for future roles at Diyar Sanat Tabriz.",
    alternates: {
      canonical: `/${lang}/careers`,
      languages: { fa: "/fa/careers", en: "/en/careers" },
    },
  };
}
export default async function CareersPage({ params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const fa = lang === "fa";
  const { data: rows = [] } = await (await createClient())
    .from("job_positions")
    .select(
      "id,slug,department,employment_type,title_fa,title_en,summary_fa,summary_en,location_fa,location_en",
    )
    .eq("is_published", true)
    .lte("published_at", new Date().toISOString())
    .order("position");
  const jobs = (rows ?? []).map((item) => ({
    id: item.id,
    slug: item.slug,
    department: item.department,
    employment_type: item.employment_type,
    title: fa ? item.title_fa : item.title_en,
    summary: (fa ? item.summary_fa : item.summary_en) ?? "",
    location: fa ? item.location_fa : item.location_en,
  }));
  return (
    <main id="main-content" className="business-page">
      <InnerPageHero
        locale={lang}
        current={fa ? "فرصت‌های شغلی" : "Careers"}
        eyebrow={fa ? "رشد در کنار یکدیگر" : "Growing together"}
        title={fa ? "فرصت‌های شغلی" : "Careers at Diyar Sanat"}
        description={
          fa
            ? "موقعیت‌های تأییدشده شرکت را جست‌وجو کنید یا برای فرصت‌های آینده، رزومه عمومی خود را در بانک استعداد ثبت کنید."
            : "Explore approved openings or submit a general résumé to the talent pool for future opportunities."
        }
      />
      <div className="container-wide careers-content">
        <CareerList locale={lang} jobs={jobs} />
        <ResumeForm locale={lang} />
      </div>
    </main>
  );
}
