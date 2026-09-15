import Link from "next/link";
import type { CSSProperties } from "react";
import type { Locale } from "@/lib/i18n";

type Props = {
  locale: Locale;
  compact?: boolean;
  logoUrl?: string | null;
  title?: string | null;
};

export function BrandMark({ locale, compact = false, logoUrl, title }: Props) {
  const fallbackTitle = locale === "fa" ? "دیار صنعت تبریز" : "Diyar Sanat Tabriz";
  const brandTitle = title?.trim() || fallbackTitle;
  const uploadedLogoStyle: CSSProperties | undefined = logoUrl
    ? { background: "transparent", border: 0, borderRadius: 0, boxShadow: "none" }
    : undefined;

  return (
    <Link href={`/${locale}`} className="brand-mark" aria-label={brandTitle}>
      <span className="brand-symbol" aria-hidden="true" style={uploadedLogoStyle}>
        {logoUrl ? (
          <img
            src={logoUrl}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
          />
        ) : (
          "DST"
        )}
      </span>
      {!compact ? (
        <span className="brand-copy">
          <strong>{brandTitle}</strong>
        </span>
      ) : null}
    </Link>
  );
}
