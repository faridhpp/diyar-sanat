"use client";

import { type FormEvent, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { DynamicCaptcha } from "@/components/dynamic-captcha";

function Success({
  locale,
  code,
  reset,
}: {
  locale: Locale;
  code: string;
  reset: () => void;
}) {
  const fa = locale === "fa";
  return (
    <div className="form-success" role="status">
      <span>✓</span>
      <h2>
        {fa
          ? "اطلاعات شما آماده بررسی است"
          : "Your information is ready for review"}
      </h2>
      <p>
        {fa
          ? "این نسخه هنوز به سامانه ثبت درخواست متصل نیست؛ کد زیر فقط برای پیش‌نمایش فرایند تولید شده است."
          : "This version is not yet connected to request storage; the code below previews the intended flow."}
      </p>
      <strong dir="ltr">{code}</strong>
      <button type="button" className="button button-secondary" onClick={reset}>
        {fa ? "فرم جدید" : "New form"}
      </button>
    </div>
  );
}
function submitCode(prefix: string) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}`;
}
function Privacy({ locale }: { locale: Locale }) {
  return (
    <>
      <DynamicCaptcha locale={locale} />
      <label className="form-consent">
        <input required type="checkbox" />
        <span>
          {locale === "fa"
            ? "با پردازش اطلاعات این فرم مطابق سیاست حریم خصوصی موافقم."
            : "I consent to the processing of this form under the privacy policy."}
        </span>
      </label>
    </>
  );
}
function Captcha({ locale }: { locale: Locale }) {
  return (
    <span className="sr-only">
      {locale === "fa" ? "کنترل امنیتی فرم" : "Form security check"}
    </span>
  );
}

export function ContactForm({ locale }: { locale: Locale }) {
  const fa = locale === "fa";
  const [code, setCode] = useState("");
  if (code)
    return <Success locale={locale} code={code} reset={() => setCode("")} />;
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCode(submitCode("CNT"));
  };
  return (
    <form className="business-form" onSubmit={submit}>
      <div className="business-form-heading">
        <span>{fa ? "فرم ارتباط مستقیم" : "Direct contact form"}</span>
        <h2>{fa ? "چطور می‌توانیم کمک کنیم؟" : "How can we help?"}</h2>
        <p>
          {fa
            ? "واحد مقصد را انتخاب کنید تا درخواست شما در مسیر درست بررسی شود."
            : "Choose the destination team so your request can be routed correctly."}
        </p>
      </div>
      <div className="business-form-grid">
        <Field
          label={fa ? "نام و نام خانوادگی *" : "Full name *"}
          name="name"
          required
        />
        <Field
          label={fa ? "شماره همراه *" : "Mobile *"}
          name="mobile"
          type="tel"
          required
          dir="ltr"
        />
        <Field
          label={fa ? "ایمیل *" : "Email *"}
          name="email"
          type="email"
          required
          dir="ltr"
        />
        <Field label={fa ? "موضوع *" : "Subject *"} name="subject" required />
        <label className="business-field">
          <span>{fa ? "واحد مقصد *" : "Destination team *"}</span>
          <select required defaultValue="">
            <option value="" disabled>
              {fa ? "انتخاب واحد" : "Choose a team"}
            </option>
            <option>{fa ? "فروش" : "Sales"}</option>
            <option>{fa ? "پشتیبانی فنی" : "Technical support"}</option>
            <option>{fa ? "منابع انسانی" : "Human resources"}</option>
            <option>{fa ? "روابط عمومی" : "Public relations"}</option>
          </select>
        </label>
        <label className="business-field field-wide">
          <span>{fa ? "پیام *" : "Message *"}</span>
          <textarea required rows={6} />
        </label>
        <label className="business-upload field-wide">
          <input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
          <span>＋</span>
          <div>
            <strong>{fa ? "افزودن فایل پیوست" : "Add attachment"}</strong>
            <small>{fa ? "حداکثر ۱۰ مگابایت" : "Up to 10 MB"}</small>
          </div>
        </label>
        <Captcha locale={locale} />
        <Privacy locale={locale} />
      </div>
      <button className="button button-primary form-submit" type="submit">
        {fa ? "ثبت پیام" : "Submit message"}
      </button>
    </form>
  );
}

export function InternationalForm({ locale }: { locale: Locale }) {
  const fa = locale === "fa";
  const [code, setCode] = useState("");
  if (code)
    return <Success locale={locale} code={code} reset={() => setCode("")} />;
  return (
    <form
      className="business-form"
      onSubmit={(event) => {
        event.preventDefault();
        setCode(submitCode("INT"));
      }}
    >
      <div className="business-form-heading">
        <span>{fa ? "توسعه بازارهای آینده" : "Future market development"}</span>
        <h2>
          {fa
            ? "پیشنهاد همکاری بین‌المللی"
            : "International partnership inquiry"}
        </h2>
        <p>
          {fa
            ? "اطلاعات شرکت و مدل همکاری پیشنهادی را برای ارزیابی اولیه معرفی کنید."
            : "Introduce your company and proposed cooperation model for initial evaluation."}
        </p>
      </div>
      <div className="business-form-grid">
        <Field
          label={fa ? "نام شرکت *" : "Company name *"}
          name="company"
          required
        />
        <Field label={fa ? "کشور *" : "Country *"} name="country" required />
        <Field
          label={fa ? "وب‌سایت" : "Website"}
          name="website"
          type="url"
          dir="ltr"
        />
        <Field
          label={fa ? "حوزه فعالیت *" : "Business field *"}
          name="sector"
          required
        />
        <label className="business-field field-wide">
          <span>
            {fa
              ? "سابقه واردات یا توزیع *"
              : "Import or distribution experience *"}
          </span>
          <textarea required rows={4} />
        </label>
        <Field
          label={fa ? "محصولات موردنظر *" : "Products of interest *"}
          name="products"
          required
        />
        <Field
          label={fa ? "حجم تقریبی موردنظر" : "Estimated volume"}
          name="volume"
        />
        <label className="business-field">
          <span>{fa ? "نوع همکاری *" : "Cooperation type *"}</span>
          <select required defaultValue="">
            <option value="" disabled>
              {fa ? "انتخاب نوع همکاری" : "Choose cooperation type"}
            </option>
            <option>{fa ? "واردات و توزیع" : "Import and distribution"}</option>
            <option>
              {fa ? "نمایندگی منطقه‌ای" : "Regional representation"}
            </option>
            <option>{fa ? "تولید قراردادی" : "Contract manufacturing"}</option>
            <option>{fa ? "سایر پیشنهادها" : "Other proposal"}</option>
          </select>
        </label>
        <label className="business-upload field-wide">
          <input type="file" accept=".pdf,.ppt,.pptx,.doc,.docx" required />
          <span>＋</span>
          <div>
            <strong>{fa ? "پروفایل شرکت *" : "Company profile *"}</strong>
            <small>PDF, PPTX, DOCX — 10 MB</small>
          </div>
        </label>
        <Privacy locale={locale} />
      </div>
      <button className="button button-primary form-submit" type="submit">
        {fa ? "ارسال پیشنهاد همکاری" : "Submit partnership inquiry"}
      </button>
    </form>
  );
}

export function ResumeForm({
  locale,
  position = "general",
}: {
  locale: Locale;
  position?: string;
}) {
  const fa = locale === "fa";
  const [code, setCode] = useState("");
  if (code)
    return <Success locale={locale} code={code} reset={() => setCode("")} />;
  return (
    <form
      className="business-form compact-form"
      onSubmit={(event) => {
        event.preventDefault();
        setCode(submitCode("CV"));
      }}
    >
      <div className="business-form-heading">
        <span>{fa ? "بانک استعداد دیار صنعت" : "Diyar Sanat talent pool"}</span>
        <h2>{fa ? "ارسال رزومه عمومی" : "Submit a general résumé"}</h2>
        <p>
          {fa
            ? "حتی اگر موقعیت فعالی وجود ندارد، رزومه شما می‌تواند برای فرصت‌های آینده بررسی شود."
            : "Even when no role is active, your résumé may be considered for future opportunities."}
        </p>
      </div>
      <input type="hidden" name="position" value={position} />
      <div className="business-form-grid">
        <Field
          label={fa ? "نام و نام خانوادگی *" : "Full name *"}
          name="name"
          required
        />
        <Field
          label={fa ? "موبایل *" : "Mobile *"}
          name="mobile"
          type="tel"
          required
          dir="ltr"
        />
        <Field
          label={fa ? "ایمیل *" : "Email *"}
          name="email"
          type="email"
          required
          dir="ltr"
        />
        <Field
          label={fa ? "حوزه تخصصی *" : "Area of expertise *"}
          name="expertise"
          required
        />
        <label className="business-upload field-wide">
          <input type="file" accept=".pdf,.doc,.docx" required />
          <span>＋</span>
          <div>
            <strong>{fa ? "فایل رزومه *" : "Résumé file *"}</strong>
            <small>PDF, DOC, DOCX — 10 MB</small>
          </div>
        </label>
        <label className="business-field field-wide">
          <span>{fa ? "توضیحات کوتاه" : "Short note"}</span>
          <textarea rows={3} />
        </label>
        <Privacy locale={locale} />
      </div>
      <button className="button button-primary form-submit" type="submit">
        {fa ? "ارسال رزومه" : "Submit résumé"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
  dir,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  dir?: "ltr";
}) {
  return (
    <label className="business-field">
      <span>{label}</span>
      <input name={name} type={type} required={required} dir={dir} />
    </label>
  );
}
