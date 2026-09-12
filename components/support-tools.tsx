"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { SearchIcon, ShieldIcon } from "@/components/icons";
import type { Locale } from "@/lib/i18n";
import { DynamicCaptcha } from "@/components/dynamic-captcha";

type FaqItem = { category: string; question: string; answer: string };

export function FaqExplorer({ locale, items }: { locale: Locale; items: FaqItem[] }) {
  const fa = locale === "fa";
  const categories = useMemo(() => [fa ? "همه" : "All", ...Array.from(new Set(items.map((item) => item.category)))], [fa, items]);
  const [category, setCategory] = useState(categories[0]);
  const [query, setQuery] = useState("");
  const visible = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase(locale);
    return items.filter((item) => (category === categories[0] || item.category === category) && (!normalized || `${item.question} ${item.answer}`.toLocaleLowerCase(locale).includes(normalized)));
  }, [category, categories, items, locale, query]);

  return <section className="container-wide faq-explorer" aria-labelledby="faq-list-title">
    <div className="faq-tools">
      <label><SearchIcon className="size-5" /><span className="sr-only">{fa ? "جست‌وجوی پرسش‌ها" : "Search questions"}</span><input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder={fa ? "پرسش خود را جست‌وجو کنید…" : "Search your question…"} /></label>
      <div className="faq-categories" role="group" aria-label={fa ? "دسته‌بندی پرسش‌ها" : "Question categories"}>{categories.map((item) => <button type="button" className={category === item ? "active" : undefined} aria-pressed={category === item} onClick={() => setCategory(item)} key={item}>{item}</button>)}</div>
    </div>
    <div className="faq-results"><header><span>{fa ? "پاسخ‌های روشن و کوتاه" : "Clear, concise answers"}</span><h2 id="faq-list-title">{fa ? "پرسش‌های پرتکرار" : "Frequently asked questions"}</h2><small>{visible.length} {fa ? "پرسش" : "questions"}</small></header>{visible.length ? <div className="faq-list">{visible.map((item, index) => <details key={item.question} open={index === 0 && !query}><summary><span>{item.category}</span><strong>{item.question}</strong><i aria-hidden="true">+</i></summary><div><p>{item.answer}</p></div></details>)}</div> : <div className="support-empty"><SearchIcon className="size-8" /><h3>{fa ? "پاسخی پیدا نشد" : "No answer found"}</h3><p>{fa ? "عبارت کوتاه‌تری بنویسید یا دسته‌بندی دیگری را انتخاب کنید." : "Try a shorter phrase or choose another category."}</p></div>}</div>
  </section>;
}

export function TrackingLookup({ locale }: { locale: Locale }) {
  const fa = locale === "fa";
  const [notice, setNotice] = useState(false);
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setNotice(true); }
  return <section className="container-wide tracking-layout">
    <form className="tracking-form" onSubmit={submit} aria-labelledby="tracking-form-title">
      <header><span>{fa ? "استعلام وضعیت" : "Status lookup"}</span><h2 id="tracking-form-title">{fa ? "اطلاعات درخواست را وارد کنید" : "Enter request details"}</h2><p>{fa ? "کد پیگیری را دقیقاً مطابق پیام تأیید و شماره موبایل را با ارقام انگلیسی وارد کنید." : "Enter the tracking code exactly as shown in your confirmation and use Latin digits for mobile."}</p></header>
      <label><span>{fa ? "کد پیگیری" : "Tracking code"}</span><input required name="trackingCode" dir="ltr" autoComplete="off" minLength={6} placeholder="DST-XXXXXXXX" /></label>
      <label><span>{fa ? "شماره موبایل" : "Mobile number"}</span><input required name="mobile" dir="ltr" inputMode="tel" autoComplete="tel" pattern="09[0-9]{9}" placeholder="09xxxxxxxxx" /></label>
      <DynamicCaptcha locale={locale} className="tracking-captcha" />
      <button className="button button-primary" type="submit">{fa ? "بررسی وضعیت درخواست" : "Check request status"}</button>
      {notice ? <div className="tracking-service-notice" role="status"><ShieldIcon className="size-6" /><div><strong>{fa ? "سامانه پیگیری آنلاین هنوز متصل نشده است" : "Online tracking is not connected yet"}</strong><p>{fa ? "اطلاعات واردشده ارسال یا ذخیره نشد. برای پیگیری، کد خود را از طریق صفحه تماس با ما در اختیار واحد مربوط قرار دهید." : "Your information was not sent or stored. Please share your code with the relevant team through the contact page."}</p><Link href={`/${locale}/contact`}>{fa ? "ارتباط با واحد پاسخ‌گویی" : "Contact support"}</Link></div></div> : null}
    </form>
    <aside className="tracking-help"><span><ShieldIcon className="size-7" /></span><h2>{fa ? "کدام درخواست‌ها قابل پیگیری‌اند؟" : "Which requests can be tracked?"}</h2><ul><li>{fa ? "درخواست نمایندگی و همکاری تجاری" : "Representative and business applications"}</li><li>{fa ? "پیام‌های ثبت‌شده از فرم تماس" : "Messages submitted through contact forms"}</li><li>{fa ? "درخواست همکاری بین‌المللی" : "International cooperation inquiries"}</li></ul><p>{fa ? "کد پیگیری محرمانه نیست، اما برای حفظ حریم خصوصی آن را فقط از مسیرهای رسمی شرکت ارسال کنید." : "A tracking code is not a password, but share it only through official company channels to protect your privacy."}</p></aside>
  </section>;
}
