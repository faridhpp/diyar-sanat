import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronIcon, HomeIcon, MapPinIcon, ShieldIcon } from "@/components/icons";
import { RepresentativeMap } from "@/components/representative-map";
import { RepresentativeSelectors } from "@/components/representative-selectors";
import { getDictionary, isLocale } from "@/lib/i18n";
import { getPublishedRepresentatives } from "@/lib/representative-content";
import { findRegion, isCountry, regionName, regions, type CountryCode } from "@/lib/representatives";

type Props = { params: Promise<{ lang: string; segments?: string[] }> };

function resolveSegments(segments?: string[]) {
  if (!segments?.length) return { country: "iran" as CountryCode, region: undefined };
  if (segments.length > 2 || !isCountry(segments[0])) return null;
  const country = segments[0];
  const region = segments[1] ? findRegion(country, segments[1]) : undefined;
  if (segments[1] && !region) return null;
  return { country, region };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, segments } = await params;
  if (!isLocale(lang)) return {};
  const resolved = resolveSegments(segments);
  if (!resolved) return {};
  const place = resolved.region ? regionName(resolved.region, lang) : resolved.country === "iran" ? (lang === "fa" ? "ایران" : "Iran") : (lang === "fa" ? "عراق" : "Iraq");
  const title = lang === "fa" ? `نمایندگان دیار صنعت در ${place}` : `Diyar Sanat representatives in ${place}`;
  return { title, description: lang === "fa" ? `یافتن نمایندگان تأییدشده دیار صنعت تبریز در ${place}.` : `Find approved Diyar Sanat Tabriz representatives in ${place}.`, alternates: { canonical: `/${lang}/representatives/${resolved.country}${resolved.region ? `/${resolved.region.slug}` : ""}` } };
}

export default async function RepresentativesPage({ params }: Props) {
  const { lang, segments } = await params;
  if (!isLocale(lang)) notFound();
  const resolved = resolveSegments(segments);
  if (!resolved) notFound();
  const dict = getDictionary(lang);
  const { country, region } = resolved;
  const publishedRepresentatives = await getPublishedRepresentatives();
  const matching = publishedRepresentatives.filter((item) => item.country === country && (!region || item.region === region.slug));
  const countryLabel = country === "iran" ? (lang === "fa" ? "ایران" : "Iran") : (lang === "fa" ? "عراق" : "Iraq");
  const selectedLabel = region ? regionName(region, lang) : countryLabel;
  const byCity = matching.reduce((groups, item) => {
    const city = lang === "fa" ? item.cityFa : item.cityEn;
    const current = groups.get(city) ?? [];
    current.push(item);
    groups.set(city, current);
    return groups;
  }, new Map<string, (typeof matching)[number][]>());

  return <main id="main-content" className="representatives-page">
    <nav className="representative-breadcrumbs" aria-label={lang === "fa" ? "مسیر صفحه" : "Breadcrumb"}><div className="container-wide"><Link href={`/${lang}`} aria-label={dict.navigation.home}><HomeIcon className="size-4" /></Link><ChevronIcon className="directional-icon size-4" /><Link href={`/${lang}/representatives`}>{dict.navigation.representatives}</Link>{region ? <><ChevronIcon className="directional-icon size-4" /><span aria-current="page">{selectedLabel}</span></> : null}</div></nav>
    <header className="representatives-hero"><div className="container-wide">
      <span className="eyebrow">{lang === "fa" ? "شبکه فروش و پشتیبانی" : "Sales and support network"}</span><h1>{lang === "fa" ? "نماینده نزدیک خود را پیدا کنید" : "Find your nearest representative"}</h1><p>{lang === "fa" ? "کشور و استان خود را انتخاب کنید؛ فقط اطلاعات نمایندگان تأییدشده مجموعه نمایش داده می‌شود." : "Choose a country and region; only company-approved representative details are published."}</p>
    </div></header>
    <div className="container-wide representatives-content">
      <nav className="country-tabs" aria-label={lang === "fa" ? "انتخاب کشور" : "Choose country"}>{(["iran","iraq"] as const).map((item) => <Link key={item} href={`/${lang}/representatives/${item}`} className={country === item ? "active" : undefined} aria-current={country === item ? "page" : undefined}>{item === "iran" ? (lang === "fa" ? "ایران" : "Iran") : (lang === "fa" ? "عراق" : "Iraq")}</Link>)}</nav>
      <RepresentativeSelectors locale={lang} country={country} region={region?.slug} regionOptions={regions[country]} />
      <div className="representatives-workspace">
        <RepresentativeMap locale={lang} country={country} regions={regions[country]} active={region?.slug} />
        <section className="representative-results" aria-live="polite"><header><span><MapPinIcon className="size-5" /></span><div><small>{lang === "fa" ? "محدوده انتخاب‌شده" : "Selected area"}</small><h2>{selectedLabel}</h2></div></header>
          {matching.length ? Array.from(byCity, ([city, items]) => <section className="city-group" key={city}><h3>{city}</h3>{items.map((item) => {
            const business = lang === "fa" ? item.businessFa : item.businessEn;
            const manager = lang === "fa" ? item.managerFa : item.managerEn;
            const address = lang === "fa" ? item.addressFa : item.addressEn;
            const whatsappHref = item.whatsapp ? `https://wa.me/${item.whatsapp.replace(/\D/g, "")}` : undefined;
            return <article className="representative-card" key={item.id}>
              <h4>{business}</h4>
              <p>{lang === "fa" ? "مسئول نمایندگی" : "Representative manager"}: <strong>{manager}</strong></p>
              <address>{address}</address>
              <p><a href={`tel:${item.phone}`} dir="ltr">{item.phone}</a>{whatsappHref ? <> · <a href={whatsappHref} target="_blank" rel="noreferrer">{lang === "fa" ? "واتساپ" : "WhatsApp"}</a></> : null}{item.directions ? <> · <a href={item.directions} target="_blank" rel="noreferrer">{lang === "fa" ? "مسیریابی" : "Directions"}</a></> : null}</p>
            </article>;
          })}</section>) : <div className="representatives-empty"><span><ShieldIcon className="size-8" /></span><h3>{lang === "fa" ? "نماینده تأییدشده‌ای ثبت نشده است" : "No approved representative is listed yet"}</h3><p>{lang === "fa" ? "اطلاعات تماس فقط پس از تأیید رسمی مجموعه در این صفحه منتشر می‌شود. استان دیگری را انتخاب کنید یا برای پیگیری با دفتر مرکزی تماس بگیرید." : "Contact details are published only after company approval. Choose another region or contact the head office."}</p><Link className="button button-secondary" href={`/${lang}#contact`}>{dict.actions.contact}</Link></div>}
        </section>
      </div>
      <section className="representative-join-banner" aria-labelledby="representative-join-title">
        <div><span>{lang === "fa" ? "همکاری تجاری با دیار صنعت" : "Partner with Diyar Sanat"}</span><h2 id="representative-join-title">{lang === "fa" ? "به جمع نمایندگان ما بپیوندید" : "Join our representative network"}</h2><p>{lang === "fa" ? "اگر در فروش و توزیع محصولات خودرویی تجربه دارید، درخواست خود را برای بررسی همکاری ثبت کنید." : "If you have experience in automotive product sales and distribution, submit your application for review."}</p></div>
        <Link className="representative-join-action" href={`/${lang}/representative-application`}>{lang === "fa" ? "درخواست نمایندگی" : "Apply for representation"}<span aria-hidden="true">←</span></Link>
      </section>
    </div>
  </main>;
}
