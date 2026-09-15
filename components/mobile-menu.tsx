"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BrandMark } from "@/components/brand-mark";
import { ChevronIcon, MenuIcon } from "@/components/icons";
import { brands } from "@/lib/brands";
import type { Locale } from "@/lib/i18n";

type Props = {
  locale: Locale;
  items: readonly (readonly [string, string])[];
  logoUrl?: string | null;
  brandTitle?: string | null;
};

export function MobileMenu({ locale, items, logoUrl, brandTitle }: Props) {
  const [open, setOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const fa = locale === "fa";

  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", close);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", close); document.body.style.overflow = ""; };
  }, [open]);

  const closeMenu = () => { setOpen(false); setProductsOpen(false); };

  return <div className="mobile-menu">
    <button type="button" className="icon-button mobile-menu-trigger" aria-label={fa ? "باز کردن منو" : "Open menu"} aria-expanded={open} onClick={() => setOpen(true)}><MenuIcon className="size-6" /></button>
    {open ? <div className="mobile-menu-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeMenu(); }}>
      <div className="mobile-menu-panel" role="dialog" aria-modal="true" aria-label={fa ? "منوی اصلی" : "Main menu"} dir={fa ? "rtl" : "ltr"}>
        <header><BrandMark locale={locale} compact logoUrl={logoUrl} title={brandTitle}/><button type="button" className="mobile-menu-close" onClick={closeMenu} aria-label={fa ? "بستن منو" : "Close menu"}>×</button></header>
        <nav aria-label={fa ? "منوی موبایل" : "Mobile menu"}>
          {items.map(([label, href], index) => index === 2 ? <section className={`mobile-products-menu ${productsOpen ? "open" : ""}`} key={href}>
            <button type="button" aria-expanded={productsOpen} aria-controls="mobile-products-panel" onClick={() => setProductsOpen((value) => !value)}><span>{label}</span><ChevronIcon className="size-4" /></button>
            {productsOpen ? <div id="mobile-products-panel" className="mobile-products-panel">
              <div className="mobile-products-heading"><small>{fa ? "محصولات بر اساس برند" : "Products by brand"}</small><strong>{fa ? "برند موردنظر را انتخاب کنید" : "Choose a brand"}</strong></div>
              <div className="mobile-brand-links">{brands.map((brand) => <Link className={`brand-${brand.code}`} href={`/${locale}/products?brand=${brand.code}`} onClick={closeMenu} key={brand.code}><span dir="ltr">{brand.latin}</span><small>{fa ? `محصولات برند ${brand.fa}` : `${brand.en} products`}</small><ChevronIcon className="directional-icon size-4" /></Link>)}</div>
              <Link className="mobile-all-products" href={`/${locale}/products`} onClick={closeMenu}>{fa ? "مشاهده همه محصولات" : "View all products"}<ChevronIcon className="directional-icon size-4" /></Link>
            </div> : null}
          </section> : <Link key={href} href={href} onClick={closeMenu}>{label}<ChevronIcon className="directional-icon size-4" /></Link>)}
        </nav>
      </div>
    </div> : null}
  </div>;
}
