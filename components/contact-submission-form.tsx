"use client";

import { type FormEvent, useState } from "react";
import { DynamicCaptcha } from "@/components/dynamic-captcha";
import type { Locale } from "@/lib/i18n";

export function ContactSubmissionForm({ locale }: { locale: Locale }) {
  const fa = locale === "fa";
  const [state, setState] = useState<{ loading?: boolean; code?: string; error?: boolean }>({});
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setState({ loading: true });
    const response = await fetch("/api/contact-submissions", { method: "POST", body: new FormData(event.currentTarget) });
    const result = await response.json().catch(() => ({}));
    setState(response.ok ? { code: result.trackingCode } : { error: true });
  }
  if (state.code) return <div className="form-success" role="status"><span>✓</span><h2>{fa ? "پیام شما ثبت شد" : "Your message was submitted"}</h2><p>{fa ? "کد پیگیری را نگهداری کنید." : "Keep this tracking code."}</p><strong dir="ltr">{state.code}</strong><button className="button button-secondary" onClick={() => setState({})}>{fa ? "پیام جدید" : "New message"}</button></div>;
  return <form className="business-form" onSubmit={submit} encType="multipart/form-data"><div className="business-form-heading"><span>{fa ? "فرم ارتباط مستقیم" : "Direct contact form"}</span><h2>{fa ? "چطور می‌توانیم کمک کنیم؟" : "How can we help?"}</h2></div><input type="hidden" name="locale" value={locale} /><div className="business-form-grid"><Field name="name" label={fa ? "نام و نام خانوادگی *" : "Full name *"} /><Field name="mobile" type="tel" dir="ltr" label={fa ? "شماره همراه *" : "Mobile *"} /><Field name="email" type="email" dir="ltr" label={fa ? "ایمیل *" : "Email *"} /><Field name="subject" label={fa ? "موضوع *" : "Subject *"} /><label className="business-field"><span>{fa ? "واحد مقصد *" : "Destination team *"}</span><select name="destination" required defaultValue=""><option value="" disabled>{fa ? "انتخاب واحد" : "Choose a team"}</option><option value="sales">{fa ? "فروش" : "Sales"}</option><option value="technical">{fa ? "پشتیبانی فنی" : "Technical support"}</option><option value="hr">{fa ? "منابع انسانی" : "Human resources"}</option><option value="pr">{fa ? "روابط عمومی" : "Public relations"}</option></select></label><label className="business-field field-wide"><span>{fa ? "پیام *" : "Message *"}</span><textarea name="message" required rows={6} /></label><label className="business-upload field-wide"><input name="attachment" type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" /><span>＋</span><div><strong>{fa ? "افزودن فایل پیوست" : "Add attachment"}</strong><small>{fa ? "حداکثر ۱۰ مگابایت" : "Up to 10 MB"}</small></div></label><DynamicCaptcha locale={locale} /><label className="form-consent"><input name="consent" required type="checkbox" /><span>{fa ? "با پردازش اطلاعات مطابق حریم خصوصی موافقم." : "I consent to processing under the privacy policy."}</span></label></div>{state.error ? <p className="admin-alert error" role="alert">{fa ? "ثبت پیام انجام نشد." : "Submission failed."}</p> : null}<button className="button button-primary form-submit" disabled={state.loading}>{state.loading ? (fa ? "در حال ارسال…" : "Submitting…") : (fa ? "ثبت پیام" : "Submit message")}</button></form>;
}

function Field({ name, label, type = "text", dir }: { name: string; label: string; type?: string; dir?: "ltr" }) { return <label className="business-field"><span>{label}</span><input name={name} type={type} dir={dir} required /></label>; }
