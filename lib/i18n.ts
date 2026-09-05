export const locales = ["fa", "en"] as const;

export type Locale = (typeof locales)[number];

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function directionFor(locale: Locale) {
  return locale === "fa" ? "rtl" : "ltr";
}

const dictionaries = {
  fa: {
    brandName: "دیار صنعت تبریز",
    brandLatin: "Diyar Sanat Tabriz",
    navigation: {
      home: "صفحه اصلی",
      about: "درباره ما",
      products: "محصولات",
      representatives: "نمایندگان",
      certificates: "گواهینامه‌ها",
      media: "رسانه",
      careers: "فرصت‌های شغلی",
      contact: "تماس با ما",
    },
    actions: {
      representative: "درخواست نمایندگی",
      viewProducts: "مشاهده محصولات",
      aboutFactory: "درباره کارخانه",
      viewAll: "مشاهده همه",
      details: "مشاهده جزئیات",
      more: "اطلاعات بیشتر",
      contact: "تماس با ما",
    },
    hero: {
      eyebrow: "ساخت ایران، حرکت به جلو",
      titleLead: "از تبریز",
      titleAccent: "تا بازارهای جهانی",
      description:
        "تولیدکننده روانکارها و سیالات تخصصی خودرو؛ در مسیر توسعه بازارهای منطقه‌ای و جهانی.",
      sampleImage: "تصویر نمونه صنعتی؛ جایگزین عکس تأییدشده کارخانه",
    },
    trustTitle: "چرا دیار صنعت تبریز؟",
    trust: [
      ["کنترل کیفیت", "پایش و کنترل در مراحل تولید"],
      ["فرمولاسیون تخصصی", "توسعه محصول با رویکرد فنی"],
      ["تولید ایرانی", "ساخت ایران با نگاه رو به جلو"],
      ["پشتیبانی", "پاسخ‌گویی فنی و ارتباط مستقیم"],
    ],
    products: {
      eyebrow: "دیار شیمی",
      title: "راهکارهای تخصصی برای عملکرد بهتر",
      featured: "محصولات منتخب",
      pageTitle: "محصولات دیار شیمی",
      pageDescription:
        "چهار گروه محصول برای روانکاری، انتقال قدرت، ترمز و سامانه خنک‌کاری خودرو.",
      sampleNotice:
        "محتوای نمونه محلی نمایش داده می‌شود. پس از اجرای migration و seed، همین صفحه مستقیماً از PostgreSQL خوانده خواهد شد.",
      empty: "هنوز محصول منتشرشده‌ای برای این زبان ثبت نشده است.",
    },
    factory: {
      eyebrow: "درباره کارخانه",
      title: "زیرساختی برای تولید دقیق و قابل‌اعتماد",
      body: "دیار صنعت تبریز با تمرکز بر دانش فنی، کنترل فرایند و توسعه سبد محصولات خودرویی شکل گرفته است. تصاویر رسمی خط تولید و ظرفیت‌های تأییدشده پس از دریافت از کارفرما در این بخش منتشر می‌شوند.",
      points: ["کنترل فرایند", "توسعه محصول", "پاسخ‌گویی فنی"],
    },
    media: {
      eyebrow: "رسانه",
      title: "اخبار و دانش فنی",
      items: [
        ["راهنمای انتخاب روغن موتور مناسب", "راهنما"],
        ["نقش سیالات استاندارد در نگهداری خودرو", "وبلاگ"],
        ["آشنایی با فرایند کنترل کیفیت", "اخبار شرکت"],
      ],
    },
    newsletter: {
      title: "از تازه‌های دیار صنعت باخبر شوید",
      body: "برای دریافت خبرهای شرکتی و محتوای فنی عضو شوید.",
      placeholder: "ایمیل شما",
      submit: "عضویت",
    },
    footer: {
      summary:
        "مرجع رسمی معرفی دیار صنعت تبریز، برند دیار شیمی و محصولات تخصصی خودرو.",
      rights: "تمامی حقوق برای دیار صنعت تبریز محفوظ است.",
      credit: "طراحی و توسعه: فارینو",
      status: "اطلاعات مجوزها و نشانی رسمی پس از تأیید کارفرما درج می‌شود.",
    },
    theme: { light: "حالت روشن", dark: "حالت تیره" },
    languageLabel: "English",
  },
  en: {
    brandName: "Diyar Sanat Tabriz",
    brandLatin: "Diyar Sanat Tabriz",
    navigation: {
      home: "Home",
      about: "About",
      products: "Products",
      representatives: "Representatives",
      certificates: "Certificates",
      media: "Media",
      careers: "Careers",
      contact: "Contact",
    },
    actions: {
      representative: "Apply as a representative",
      viewProducts: "Explore products",
      aboutFactory: "About the factory",
      viewAll: "View all",
      details: "View details",
      more: "Learn more",
      contact: "Contact us",
    },
    hero: {
      eyebrow: "Made in Iran, moving forward",
      titleLead: "From Tabriz",
      titleAccent: "toward global markets",
      description:
        "Automotive lubricants and specialty fluids, built for regional and future international growth.",
      sampleImage: "Sample industrial image; replace with approved factory photography",
    },
    trustTitle: "Why Diyar Sanat Tabriz?",
    trust: [
      ["Quality control", "Monitoring across production stages"],
      ["Technical formulation", "Product development with an engineering focus"],
      ["Made in Iran", "Local production with a forward-looking approach"],
      ["Technical support", "Responsive communication and product guidance"],
    ],
    products: {
      eyebrow: "Diyar Shimi",
      title: "Specialist solutions for better performance",
      featured: "Featured products",
      pageTitle: "Diyar Shimi products",
      pageDescription:
        "Four product groups for engine lubrication, transmissions, braking, and cooling systems.",
      sampleNotice:
        "Local sample content is displayed. After the migration and seed run, this route reads the same model directly from PostgreSQL.",
      empty: "No published products are available for this language yet.",
    },
    factory: {
      eyebrow: "The factory",
      title: "Infrastructure for precise, dependable production",
      body: "Diyar Sanat Tabriz is being built around technical knowledge, process control, and a focused automotive-fluid portfolio. Approved production photography and verified capacity information will be added when supplied by the company.",
      points: ["Process control", "Product development", "Technical response"],
    },
    media: {
      eyebrow: "Media",
      title: "Company news and technical knowledge",
      items: [
        ["How to choose the right engine oil", "Guide"],
        ["Why standard fluids matter in vehicle care", "Blog"],
        ["An introduction to quality-control processes", "Company news"],
      ],
    },
    newsletter: {
      title: "Stay informed about Diyar Sanat",
      body: "Join for company updates and practical technical content.",
      placeholder: "Your email",
      submit: "Subscribe",
    },
    footer: {
      summary:
        "The official source for Diyar Sanat Tabriz, Diyar Shimi, and its automotive product portfolio.",
      rights: "All rights reserved by Diyar Sanat Tabriz.",
      credit: "Designed and developed by Farino",
      status:
        "Official licensing and address details will be published after company approval.",
    },
    theme: { light: "Light theme", dark: "Dark theme" },
    languageLabel: "فارسی",
  },
} as const;

export function getDictionary(locale: Locale) {
  return dictionaries[locale];
}
