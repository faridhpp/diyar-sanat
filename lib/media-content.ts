import "server-only";
import type { Locale } from "@/lib/i18n";
import { createClient } from "@/lib/db/server";
import { hasDatabaseEnv } from "@/lib/db/env";

export type MediaKind = "news" | "blog" | "tutorial";
export type MediaArticle = {
  slug: string;
  kind: MediaKind;
  title: string;
  excerpt: string;
  image: string;
  date: string;
  readingTime: number;
  featured?: boolean;
  videoUrl?: string;
  sections: { heading?: string; paragraphs: string[]; points?: string[] }[];
};

const content: Record<Locale, MediaArticle[]> = {
  fa: [
    {
      slug: "choosing-the-right-engine-oil",
      kind: "tutorial",
      title: "راهنمای انتخاب روغن موتور مناسب",
      excerpt:
        "مروری کاربردی بر اطلاعاتی که پیش از انتخاب روغن موتور باید از دفترچه خودرو و برچسب محصول بررسی شوند.",
      image: "/images/product-engine-oil-dst.jpg",
      date: "2026-08-06",
      readingTime: 6,
      featured: true,
      sections: [
        {
          paragraphs: [
            "انتخاب روغن موتور باید بر اساس توصیه سازنده خودرو، شرایط کارکرد و مشخصات فنی تأییدشده محصول انجام شود. یک عدد یا عبارت روی بسته‌بندی به‌تنهایی برای تصمیم‌گیری کافی نیست.",
          ],
        },
        {
          heading: "پیش از خرید چه چیزهایی را بررسی کنیم؟",
          paragraphs: [
            "دفترچه خودرو مرجع اصلی انتخاب است. پس از آن باید گرید ویسکوزیته، سطح عملکرد موردنیاز و سازگاری محصول با نوع موتور بررسی شود.",
          ],
          points: [
            "توصیه رسمی سازنده خودرو",
            "شرایط آب‌وهوایی و الگوی رانندگی",
            "مشخصات فنی و اصالت بسته‌بندی",
          ],
        },
        {
          heading: "جمع‌بندی",
          paragraphs: [
            "در صورت تردید، از مشاوره فنی استفاده کنید و از جایگزینی محصول صرفاً بر اساس شباهت ظاهری بسته‌بندی خودداری کنید.",
          ],
        },
      ],
    },
    {
      slug: "why-standard-fluids-matter",
      kind: "blog",
      title: "نقش سیالات استاندارد در نگهداری خودرو",
      excerpt:
        "چرا انتخاب سیال سازگار و تعویض در بازه مناسب می‌تواند به عملکرد پایدار سامانه‌های خودرو کمک کند؟",
      image: "/images/product-antifreeze-dst.jpg",
      date: "2026-08-04",
      readingTime: 5,
      sections: [
        {
          paragraphs: [
            "سیالات خودرو بخشی از سامانه‌های مکانیکی و حرارتی هستند و انتخاب آن‌ها باید با مشخصات فنی وسیله نقلیه هماهنگ باشد.",
          ],
        },
        {
          heading: "سازگاری مهم‌تر از انتخاب عمومی",
          paragraphs: [
            "ضدیخ، روغن ترمز، روغن موتور و واسکازین کارکرد یکسانی ندارند. ترکیب یا جایگزینی بدون بررسی می‌تواند عملکرد سامانه را مختل کند.",
          ],
          points: [
            "بررسی دوره‌ای سطح و وضعیت سیال",
            "رعایت دستورالعمل تعویض",
            "استفاده از محصول با مشخصات قابل رهگیری",
          ],
        },
      ],
    },
    {
      slug: "quality-control-process-overview",
      kind: "tutorial",
      title: "آشنایی با رویکرد کنترل کیفیت",
      excerpt:
        "نگاهی آموزشی به نقاط کنترل مواد، فرایند و محصول نهایی در یک چارچوب تولید منظم.",
      image: "/images/factory-teaser-cover.png",
      date: "2026-08-02",
      readingTime: 7,
      sections: [
        {
          paragraphs: [
            "کنترل کیفیت یک آزمون منفرد در پایان تولید نیست؛ مجموعه‌ای از نقاط بررسی است که از دریافت مواد تا ثبت نتایج محصول ادامه پیدا می‌کند.",
          ],
        },
        {
          heading: "سه سطح اصلی کنترل",
          paragraphs: [
            "جزئیات هر خط تولید به فرایند و محصول وابسته است، اما چارچوب عمومی را می‌توان در سه سطح مشاهده کرد.",
          ],
          points: [
            "کنترل ورودی و شناسایی مواد",
            "پایش پارامترهای فرایند",
            "بررسی و مستندسازی محصول نهایی",
          ],
        },
      ],
    },
    {
      slug: "diyar-sanat-product-development-direction",
      kind: "news",
      title: "رویکرد دیار صنعت به توسعه سبد محصولات",
      excerpt:
        "معرفی جهت‌گیری مجموعه برای توسعه مرحله‌ای محصولات خودرویی و انتشار اطلاعات مستند.",
      image: "/images/product-gear-oil-dst.jpg",
      date: "2026-08-01",
      readingTime: 4,
      sections: [
        {
          paragraphs: [
            "دیار صنعت تبریز توسعه سبد محصولات خودرویی را با تمرکز بر نیاز کاربرد، مستندسازی فنی و ارائه اطلاعات روشن دنبال می‌کند.",
          ],
        },
        {
          heading: "انتشار مسئولانه اطلاعات",
          paragraphs: [
            "مشخصات، استانداردها و ادعاهای عملکردی هر محصول پس از تأیید اسناد مربوط به همان محصول منتشر می‌شوند. این رویکرد از انتشار اطلاعات غیرقابل‌اتکا جلوگیری می‌کند.",
          ],
        },
      ],
    },
  ],
  en: [
    {
      slug: "choosing-the-right-engine-oil",
      kind: "tutorial",
      title: "How to choose the right engine oil",
      excerpt:
        "A practical look at the information to check in the vehicle manual and on approved product documentation.",
      image: "/images/product-engine-oil-dst.jpg",
      date: "2026-08-06",
      readingTime: 6,
      featured: true,
      sections: [
        {
          paragraphs: [
            "Engine oil should be selected according to the vehicle manufacturer’s recommendation, operating conditions, and approved product specifications. A single package marking is not enough for a sound decision.",
          ],
        },
        {
          heading: "What to check before buying",
          paragraphs: [
            "The vehicle manual is the primary reference. Then review viscosity grade, required performance level, and engine compatibility.",
          ],
          points: [
            "Vehicle manufacturer recommendation",
            "Climate and driving pattern",
            "Traceable technical data and packaging",
          ],
        },
        {
          heading: "Summary",
          paragraphs: [
            "When uncertain, seek technical advice and avoid substitutions based only on similar packaging.",
          ],
        },
      ],
    },
    {
      slug: "why-standard-fluids-matter",
      kind: "blog",
      title: "Why compatible fluids matter in vehicle care",
      excerpt:
        "Why compatible fluids and appropriate service intervals support stable vehicle-system performance.",
      image: "/images/product-antifreeze-dst.jpg",
      date: "2026-08-04",
      readingTime: 5,
      sections: [
        {
          paragraphs: [
            "Automotive fluids work within mechanical and thermal systems and should match the vehicle’s technical requirements.",
          ],
        },
        {
          heading: "Compatibility comes first",
          paragraphs: [
            "Coolant, brake fluid, engine oil, and gear oil perform different tasks. Mixing or substituting without verification can disrupt system performance.",
          ],
          points: [
            "Periodic level and condition checks",
            "Following service instructions",
            "Using traceable product specifications",
          ],
        },
      ],
    },
    {
      slug: "quality-control-process-overview",
      kind: "tutorial",
      title: "Understanding a quality-control approach",
      excerpt:
        "An educational overview of material, process, and final-product control points.",
      image: "/images/factory-teaser-cover.png",
      date: "2026-08-02",
      readingTime: 7,
      sections: [
        {
          paragraphs: [
            "Quality control is not a single end-of-line test. It is a sequence of checks from material receipt through final result documentation.",
          ],
        },
        {
          heading: "Three control levels",
          paragraphs: [
            "Details vary by production line and product, but the general framework has three levels.",
          ],
          points: [
            "Incoming material identification",
            "Process parameter monitoring",
            "Final product review and documentation",
          ],
        },
      ],
    },
    {
      slug: "diyar-sanat-product-development-direction",
      kind: "news",
      title: "Diyar Sanat’s product-development direction",
      excerpt:
        "An overview of the company’s measured approach to automotive product development and documented communication.",
      image: "/images/product-gear-oil-dst.jpg",
      date: "2026-08-01",
      readingTime: 4,
      sections: [
        {
          paragraphs: [
            "Diyar Sanat Tabriz is developing its automotive portfolio around application needs, technical documentation, and clear product communication.",
          ],
        },
        {
          heading: "Responsible publication",
          paragraphs: [
            "Specifications, standards, and performance claims are published only after the relevant product documents are approved.",
          ],
        },
      ],
    },
  ],
};
function demoLongformSections(locale: Locale) {
  const faSeed =
    "لورم ایپسوم متن ساختگی با تولید سادگی نامفهوم از صنعت چاپ است. این پاراگراف نمونه فقط برای بررسی ریتم مطالعه، فاصله میان خطوط، عرض مناسب ستون، نحوه نمایش لینک‌ها و رفتار صفحه در محتوای بلند نوشته شده است. طراح و نویسنده می‌توانند پس از تأیید ساختار، آن را با محتوای تخصصی و مستند جایگزین کنند. در این نمونه تلاش شده طول جمله‌ها متنوع باشد تا شکست خطوط، تراکم بصری و حرکت چشم در نمایشگرهای دسکتاپ و موبایل به شکل واقعی‌تری ارزیابی شود.";
  const enSeed =
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. This placeholder paragraph exists only to test reading rhythm, line spacing, column width, link presentation, and long-form page behavior. Once the editorial structure is approved, the design and content teams can replace it with verified specialist copy. Sentence lengths intentionally vary so line wrapping, visual density, and eye movement can be assessed across desktop and mobile screens without implying factual product claims.";
  const seed = locale === "fa" ? faSeed : enSeed;
  const paragraphs = Array.from(
    { length: 17 },
    (_, index) =>
      `${seed} ${locale === "fa" ? `پاراگراف نمونه ${index + 1}.` : `Sample paragraph ${index + 1}.`}`,
  );
  return [
    {
      heading:
        locale === "fa"
          ? "متن نمونه برای نمایش قالب مقاله بلند"
          : "Sample copy for the long-form article layout",
      paragraphs: paragraphs.slice(0, 6),
      points:
        locale === "fa"
          ? [
              "ارزیابی خوانایی در ستون اصلی",
              "بررسی فاصله تیترها و پاراگراف‌ها",
              "آزمون نمایش محتوا در موبایل",
            ]
          : [
              "Evaluate main-column readability",
              "Review heading and paragraph spacing",
              "Test long content on mobile",
            ],
    },
    {
      heading:
        locale === "fa"
          ? "نمونه ادامه محتوا و ریتم مطالعه"
          : "Sample continuation and reading rhythm",
      paragraphs: paragraphs.slice(6, 12),
    },
    {
      heading:
        locale === "fa"
          ? "نمونه بخش پایانی مقاله"
          : "Sample final article section",
      paragraphs: paragraphs.slice(12),
    },
  ];
}

function withDemoContent(locale: Locale, article: MediaArticle): MediaArticle {
  return {
    ...article,
    sections: [...article.sections, ...demoLongformSections(locale)],
  };
}

function markdownSections(body: string) {
  const sections: MediaArticle["sections"] = [];
  let current: { heading?: string; paragraphs: string[] } = { paragraphs: [] };
  for (const block of body
    .split(/\n\s*\n/)
    .map((item) => item.trim())
    .filter(Boolean)) {
    if (block.startsWith("## ")) {
      if (current.paragraphs.length || current.heading) sections.push(current);
      current = { heading: block.slice(3).trim(), paragraphs: [] };
    } else current.paragraphs.push(block);
  }
  if (current.paragraphs.length || current.heading) sections.push(current);
  return sections.length ? sections : [{ paragraphs: [] }];
}
export async function getMediaArticlesFromDatabase(locale: Locale) {
  if (hasDatabaseEnv())
    try {
      const db = await createClient();
      const { data: entries, error } = await db
        .from("editorial_entries")
        .select("id,kind,cover_image_url,video_url,is_featured,published_at")
        .eq("is_published", true)
        .lte("published_at", new Date().toISOString())
        .order("published_at", { ascending: false });
      if (!error && entries?.length) {
        const { data: translations } = await db
          .from("editorial_translations")
          .select("entry_id,title,slug,excerpt,body_markdown")
          .eq("locale", locale)
          .in(
            "entry_id",
            entries.map((item) => item.id),
          );
        const copy = new Map(
          (translations ?? []).map((item) => [item.entry_id, item]),
        );
        const mapped = entries.flatMap((entry) => {
          const item = copy.get(entry.id);
          if (!item) return [];
          const words = item.body_markdown.split(/\s+/).length;
          return [
            {
              slug: item.slug,
              kind: (entry.kind === "article"
                ? "blog"
                : entry.kind === "guide"
                  ? "tutorial"
                  : "news") as MediaKind,
              title: item.title,
              excerpt: item.excerpt ?? "",
              image:
                entry.cover_image_url ?? "/images/factory-teaser-cover.png",
              date: (entry.published_at ?? entry.id.toString()).slice(0, 10),
              readingTime: Math.max(1, Math.ceil(words / 200)),
              featured: entry.is_featured,
              videoUrl: entry.video_url ?? undefined,
              sections: markdownSections(item.body_markdown),
            },
          ];
        });
        if (mapped.length) return mapped;
      }
    } catch {}
  return content[locale].map((article) => withDemoContent(locale, article));
}
export function getMediaArticles(locale: Locale) {
  return content[locale].map((article) => withDemoContent(locale, article));
}
export function findMediaArticle(locale: Locale, slug: string) {
  return getMediaArticles(locale).find((item) => item.slug === slug);
}
export function mediaKindLabel(locale: Locale, kind: MediaKind) {
  const labels = {
    fa: { news: "اخبار", blog: "وبلاگ", tutorial: "آموزش" },
    en: { news: "News", blog: "Blog", tutorial: "Tutorial" },
  };
  return labels[locale][kind];
}
