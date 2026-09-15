import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getManagedMetadata, getManagedTranslations } from "@/lib/site-content";
import { isLocale } from "@/lib/i18n";
import styles from "./about.module.css";

type Props = { params: Promise<{ lang: string }> };

const ABOUT_HERO_IMAGE = "/images/about-factory.png";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const fa = lang === "fa";
  return getManagedMetadata(lang, "/about", {
    title: fa ? "درباره ما | دیار صنعت تبریز" : "About us | Diyar Sanat Tabriz",
    description: fa
      ? "معرفی شرکت دیار صنعت تبریز، رویکرد کیفیت، ارزش‌ها و چشم‌انداز توسعه در صنعت روانکارها و محصولات شیمیایی خودرو."
      : "Learn about Diyar Sanat Tabriz, its quality approach, values, and development vision in automotive lubricants and chemical products.",
    alternates: {
      canonical: `/${lang}/about`,
      languages: { fa: "/fa/about", en: "/en/about" },
    },
  });
}

export default async function AboutPage({ params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const fa = lang === "fa";
  const managed = await getManagedTranslations(lang, "about");
  const t = (key: string, faFallback: string, enFallback: string) =>
    managed[key]?.trim() || (fa ? faFallback : enFallback);

  const facts = [
    {
      label: t("facts.year.label", "سال تأسیس", "Established"),
      value: t("facts.year.value", "۱۴۰۱", "1401 SH"),
    },
    {
      label: t("facts.location.label", "موقعیت کارخانه", "Factory location"),
      value: t("facts.location.value", "تبریز، ایران", "Tabriz, Iran"),
    },
    {
      label: t("facts.focus.label", "حوزه فعالیت", "Core focus"),
      value: t("facts.focus.value", "روانکارها و سیالات خودرو", "Automotive lubricants & fluids"),
    },
  ];

  const process = [
    t("process.materials", "انتخاب مواد اولیه", "Raw-material selection"),
    t("process.production", "فرآیند تولید", "Production process"),
    t("process.packaging", "بسته‌بندی", "Packaging"),
    t("process.quality_control", "کنترل نهایی", "Final quality control"),
  ];

  const values = [
    {
      number: "01",
      title: t("value.quality.title", "کیفیت", "Quality"),
      description: t(
        "value.quality.description",
        "کیفیت برای ما نتیجه تعهد، تخصص و توجه مستمر به جزئیات در تمام مراحل کار است.",
        "For us, quality is the result of commitment, expertise, and consistent attention to detail throughout every stage.",
      ),
    },
    {
      number: "02",
      title: t("value.innovation.title", "نوآوری", "Innovation"),
      description: t(
        "value.innovation.description",
        "به‌روزرسانی دانش فنی و بهبود فرآیندها را بخشی از مسیر توسعه پایدار محصولات می‌دانیم.",
        "We treat technical development and continuous process improvement as essential parts of sustainable product growth.",
      ),
    },
    {
      number: "03",
      title: t("value.customer.title", "رضایت مشتری", "Customer trust"),
      description: t(
        "value.customer.description",
        "اعتماد مشتریان را سرمایه‌ای ارزشمند می‌دانیم و برای حفظ آن بر محصول، خدمات و پشتیبانی قابل اعتماد تمرکز می‌کنیم.",
        "We consider customer trust a valuable asset and protect it through dependable products, service, and support.",
      ),
    },
  ];

  return (
    <main id="main-content" className={styles.page}>
      <section className={styles.hero} aria-labelledby="about-title">
        <Image
          src={ABOUT_HERO_IMAGE}
          alt={t(
            "hero.image_alt",
            "نمای مجموعه صنعتی دیار صنعت تبریز",
            "Diyar Sanat Tabriz industrial facility",
          )}
          fill
          priority
          sizes="100vw"
          className={styles.heroImage}
        />
        <div className={styles.heroShade} />
        <div className={`container-wide ${styles.heroInner}`}>
          <nav className={styles.breadcrumbs} aria-label={fa ? "مسیر صفحه" : "Breadcrumb"}>
            <Link href={`/${lang}`}>{fa ? "صفحه اصلی" : "Home"}</Link>
            <span aria-hidden="true">/</span>
            <span>{t("hero.current", "درباره ما", "About us")}</span>
          </nav>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>
              {t("hero.eyebrow", "از تبریز، از سال ۱۴۰۱", "From Tabriz, since 1401 SH")}
            </span>
            <h1 id="about-title">{t("hero.title", "دیار صنعت تبریز", "Diyar Sanat Tabriz")}</h1>
            <p>
              {t(
                "hero.description",
                "تولید روانکارها، ضدیخ، مایع ترمز و محصولات شیمیایی خودرو با تمرکز بر کیفیت، توسعه فنی و اعتماد مشتریان.",
                "Automotive lubricants, antifreeze, brake fluid, and chemical products developed with a focus on quality, technical progress, and customer trust.",
              )}
            </p>
          </div>
        </div>
      </section>

      <section className={`container-wide ${styles.factRail}`} aria-label={fa ? "اطلاعات کلیدی شرکت" : "Company facts"}>
        {facts.map((fact) => (
          <article className={styles.fact} key={fact.label}>
            <small>{fact.label}</small>
            <strong>{fact.value}</strong>
          </article>
        ))}
      </section>

      <section className={`container-wide ${styles.story}`}>
        <div className={styles.storyHeading}>
          <span>{t("story.eyebrow", "درباره مجموعه", "About the company")}</span>
          <h2>{t("story.title", "تولید تخصصی با نگاه رو به توسعه", "Specialist production with a development mindset")}</h2>
        </div>
        <div className={styles.storyCopy}>
          <p>
            {t(
              "story.description",
              "شرکت دیار صنعت تبریز در سال ۱۴۰۱ با هدف تولید انواع روانکارها، ضدیخ، مایع ترمز و سایر محصولات شیمیایی خودرو تأسیس شد. کارخانه ما در شهر تبریز، به‌عنوان یکی از قطب‌های صنعتی کشور، مستقر است و با بهره‌گیری از تجهیزات تولید، فناوری‌های روز و نیروی انسانی متخصص، فعالیت خود را در مسیر تولید محصولاتی باکیفیت و قابل رقابت آغاز کرده است.",
              "Diyar Sanat Tabriz was established in 1401 SH to produce automotive lubricants, antifreeze, brake fluid, and other vehicle chemical products. Based in Tabriz, one of Iran's major industrial hubs, the company combines production equipment, current technologies, and specialist expertise to develop reliable and competitive products.",
            )}
          </p>
          <p>
            {t(
              "story.paragraph2",
              "ما در دیار صنعت بر این باوریم که کیفیت، نتیجه تعهد، تخصص و توجه به جزئیات است. به همین دلیل، از انتخاب مواد اولیه تا تولید، بسته‌بندی و کنترل نهایی محصولات، تمامی مراحل با دقت انجام می‌شود تا محصولی مطمئن، بادوام و شایسته اعتماد مصرف‌کنندگان به بازار عرضه شود.",
              "At Diyar Sanat, we believe quality is built through commitment, expertise, and attention to detail. From raw-material selection to production, packaging, and final control, every stage is approached carefully so dependable products can reach customers with confidence.",
            )}
          </p>
        </div>
      </section>

      <section className={`container-wide ${styles.commitment}`}>
        <div className={styles.commitmentCopy}>
          <span>{t("commitment.eyebrow", "رویکرد تولید", "Our production approach")}</span>
          <h2>{t("commitment.title", "کیفیت از مواد اولیه تا محصول نهایی", "Quality from raw materials to the final product")}</h2>
          <p>
            {t(
              "commitment.description",
              "با توجه به رشد صنعت خودرو و نیاز روزافزون به روانکارها و محصولات شیمیایی استاندارد، تلاش می‌کنیم محصولاتی توسعه دهیم که به حفظ عملکرد مناسب خودرو، کاهش سایش و خوردگی قطعات و پایداری عملکرد در شرایط کاری مختلف کمک کنند.",
              "As the automotive industry grows and demand for dependable lubricants and chemical products increases, we focus on products designed to support vehicle performance, reduce wear and corrosion, and remain dependable across different operating conditions.",
            )}
          </p>
        </div>
        <ol className={styles.processList}>
          {process.map((item, index) => (
            <li key={item}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{item}</strong>
            </li>
          ))}
        </ol>
      </section>

      <section className={`container-wide ${styles.valuesSection}`}>
        <header className={styles.sectionHeading}>
          <span>{t("values.eyebrow", "اصول ما", "Our principles")}</span>
          <h2>{t("values.title", "سه اصل در مسیر رشد دیار صنعت", "Three principles guiding Diyar Sanat")}</h2>
          <p>
            {t(
              "values.description",
              "کیفیت، نوآوری و رضایت مشتری سه اصل اساسی فعالیت ما هستند و تصمیم‌های توسعه‌ای مجموعه بر پایه همین سه محور شکل می‌گیرند.",
              "Quality, innovation, and customer trust are the three principles that guide how we develop products, processes, and long-term relationships.",
            )}
          </p>
        </header>
        <div className={styles.valueGrid}>
          {values.map((item) => (
            <article className={styles.valueCard} key={item.number}>
              <span>{item.number}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={`container-wide ${styles.vision}`}>
        <div className={styles.visionCopy}>
          <span>{t("vision.eyebrow", "چشم‌انداز", "Vision")}</span>
          <h2>
            {t(
              "vision.title",
              "توسعه یک برند خوش‌نام در صنعت روانکار و محصولات شیمیایی خودرو",
              "Building a trusted name in automotive lubricants and chemical products",
            )}
          </h2>
          <p>
            {t(
              "vision.description",
              "چشم‌انداز ما در دیار صنعت، توسعه جایگاه برندهای مجموعه در بازار ایران و حرکت مرحله‌به‌مرحله به سوی بازارهای منطقه‌ای و بین‌المللی است. برای تحقق این هدف بر توسعه ظرفیت تولید، ارتقای کیفیت، نوآوری و ایجاد همکاری‌های پایدار تمرکز می‌کنیم.",
              "Our vision is to strengthen the position of Diyar Sanat brands in Iran and move step by step toward regional and international markets. We focus on production development, quality improvement, innovation, and sustainable partnerships as the foundations of that journey.",
            )}
          </p>
          <strong className={styles.tagline}>
            {t(
              "vision.tagline",
              "دیار صنعت؛ کیفیتی برای اعتماد، عملکردی برای اطمینان",
              "Diyar Sanat — quality to trust, performance to rely on",
            )}
          </strong>
        </div>
        <div className={styles.visionActions}>
          <Link className={styles.primaryAction} href={`/${lang}/products`}>
            {fa ? "مشاهده محصولات" : "Explore products"}
          </Link>
          <Link className={styles.secondaryAction} href={`/${lang}/contact`}>
            {fa ? "تماس با ما" : "Contact us"}
          </Link>
        </div>
      </section>
    </main>
  );
}
