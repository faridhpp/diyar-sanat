# Development log

Update this file with every feature, bug fix, schema change, or architecture
decision. Newest entries go first.

## 2026-09-05 — Single Dockerfile deployment with existing Dokploy PostgreSQL

- Replaced the Compose deployment with one Dockerfile application connected to
  the user's existing PostgreSQL service. Removed `docker-compose.yml` and the
  separate migration/tools image. `DATABASE_URL` is the only required runtime
  environment variable; there is no second database password to configure.
- Bundled migration and bootstrap tools into the non-root production image.
  Startup applies pending Drizzle migrations under the existing advisory lock,
  starts Next.js only on success, and forwards termination signals. Repeated
  startup reuses the migration journal. Added an application healthcheck.
- Migration CLI and Drizzle config accept `DATABASE_URL`; the previous admin URL
  remains an optional CLI override. Removed the separate application-password
  rotation step. Existing transaction-local database roles and RLS remain in
  force for application queries with the supplied connection.
- Made `APP_URL` optional by checking request Origin against the public Host
  forwarded by Dokploy; explicit origin pinning remains available. Added a
  regression test for valid, invalid, and explicitly pinned origins.
- Updated `.env.example`, Dockerfile, package/lock/build scripts, generated-tool
  ignore rules, README, deployment guide, project context, and contributor rules.
  The guide covers the existing database URL, Dockerfile build type, port 3000,
  persistent uploads mount, and bundled first-manager command.
- Verification: Docker image builds without database build arguments; fresh
  container startup against a separate PostgreSQL 17 service succeeds with only
  DATABASE_URL; restart migrations and bundled manager bootstrap pass. Six
  applicable database/security/HTTP tests pass, including both locales, admin
  pages, login/OTP/logout, uploads, and all submission forms; the unchanged
  source-import test was skipped in this deployment-only pass. TypeScript and
  lint pass (five existing image-optimization warnings). No remote deployment
  or production database changes were performed.

## 2026-09-05 — PostgreSQL/Drizzle backend and Dokploy deployment on `next`

- Created the requested `next` branch and replaced Bun with pnpm 10.32.1,
  adding the pnpm lockfile as the dependency source of truth. Supabase JS,
  SSR, and CLI packages are removed from the active application.
- Ported all 37 public content tables and original seed records into the
  PostgreSQL baseline, with four private authentication tables. Added Drizzle
  schema definitions, inferred types, migration snapshots, pooled parameterized
  queries, transaction-local visitor/staff roles, and explicit grants/RLS.
  Owner credentials are confined to migration/import scripts. Original
  Supabase migrations/configuration are archived in `docs/legacy-supabase/`.
- Replaced Supabase Auth with bcrypt passwords, hashed opaque eight-hour
  sessions, secure HttpOnly cookies, logout revocation, current profile checks,
  transactional staff creation, manager-only settings updates, origin checks,
  and database-backed login throttling. SMS verification uses expiring hashed
  challenges, retry limits, and atomic single-use consumption with the existing
  provider adapters. Staff creation supports normalized SMS phone numbers.
- Replaced Storage with persistent filesystem buckets, upload validation,
  public media streaming and byte ranges, and manager/admin-only document
  downloads linked from the existing submission inboxes. All four public forms
  retain their validation, database persistence, cleanup, and tracking codes.
- Added a read-only-source Supabase import tool with dry-run inventory,
  explicit target replacement, preserved IDs/password hashes/records,
  staged file copying, public URL rewriting, and sequence repair. It invalidates
  old sessions and requires a maintenance-window cutover to a separate target.
- Added standalone build/start packaging, a non-root Docker image, and Compose
  services for PostgreSQL, migrations, web, and optional manager bootstrap,
  with healthchecks and persistent database/upload volumes. Setup, secrets,
  source-data import, backup, and rollback are documented in `docs/DEPLOYMENT.md`.
- Fixed inherited runtime issues found by the migration verification: upload
  field rendering referenced browser `location` during SSR; nested gallery/file
  folders were rejected by upload validation; homepage public policies called
  a staff helper unavailable to visitors. Migration
  `drizzle/0001_homepage_public_media.sql` corrects the latter without broadening
  anonymous staff-helper access. Array parameters are explicitly bound in the
  Drizzle repository, preserving representative facilities lists.
- Affected: all data-backed public/admin routes, `lib/db`, `lib/auth`,
  `lib/storage`, auth/settings/files/health APIs, upload/login/settings UI,
  migration/import/bootstrap scripts, package/build/deployment configuration,
  and contributor/product documentation. Public styling, RTL/LTR fonts,
  business claims, and existing canonical-domain defaults remain intact.
- Verification: fresh and repeated migration runs on PostgreSQL 17; no Drizzle
  schema drift; TypeScript and production builds pass; lint passes with only
  five existing admin image-optimization warnings. All six regression tests
  pass together against a built production container, covering both locale
  roots and public sections, 22 admin routes, CRUD/upserts/counts/search,
  anonymous/draft and staff-role isolation, connection-context reset, password
  login/logout, inactive users, concurrent OTP replay prevention, upload bytes
  and ranges, all four persisted submission types, private document permissions,
  and synthetic Supabase data/file/password import with unchanged source data.
- Deployment verification: full fresh Docker Compose deployment succeeded;
  migrations exited 0, PostgreSQL and web healthchecks are healthy, and
  `/api/health` returned HTTP 200. The optional first-manager Compose bootstrap
  also passed, including an empty optional phone value. No real production data was imported, no
  remote deployment or branch push was performed, and actual SMS delivery
  still requires the operator's provider credentials and template.

## 2026-08-07 — Vercel production build boundary fix

- Fixed the failed production build caused by the client-side media archive importing runtime values from the server-only media data module.
- Moved the small media-kind presentation mapping and serializable prop types into the client boundary so `next/headers`, the server Supabase client, and `server-only` are no longer pulled into the browser bundle.
- Affected component: `components/media-archive.tsx`.
- Verification: a complete Next.js production build passed, including TypeScript, page-data collection, and generation of all 71 static pages.

## 2026-08-07 — Visible current homepage slide in administration

- Fixed the empty slider-management state caused by the public homepage using an in-code fallback while administration only queried persisted slide rows.
- The exact currently displayed fallback image and bilingual content now appear in the slider list and editable form when no database slide exists; the first save persists it as a normal managed slide.
- Added image thumbnails, a large current-image preview, and a clear fallback-state message so editors can identify the content they are changing.
- Verification: `bun run typecheck` and `bun run lint` pass.

## 2026-08-07 — Operational admin content cards

- Restored the products and representatives indexes to responsive card layouts while preserving their complete expandable editors and role-aware delete controls.
- Redesigned certificates, gallery albums/items, central media assets, and editorial entries as consistent visual cards with clear status, preview, edit, and delete actions.
- Upgraded certificate, album, gallery-item, and media-asset server actions from create-only flows to authenticated create/update/delete operations; SEO staff cannot perform destructive actions.
- Added a real editorial editing flow that loads the selected bilingual news/article/guide into the editor, plus a role-aware delete action and public media cache revalidation.
- No database migration was required; existing tables and RLS policies remain the source of truth.
- Verification: `bun run typecheck` and `bun run lint` pass (image previews retain the existing trusted Storage URL approach and emit only the established `no-img-element` optimization warnings).

## 2026-08-07 — Managed homepage slider and factory video

- Added unlimited bilingual homepage hero slides with secure image upload, Persian/English alt text, kicker, title, subtitle, description, two configurable CTAs, ordering, draft/publication state, editing, and deletion.
- Converted the visual-only homepage hero into an interactive client slider that consumes published managed slides while retaining the existing static hero as a safe pre-migration fallback.
- Added managed factory-introduction media with video upload, cover upload, bilingual title/subtitle/description, and publication control directly inside `/admin/translations` under page content.
- Connected the managed cover and video to the homepage factory teaser; when no managed media exists, the current approved cover and presentation remain intact.
- Added migration `20260807163600_homepage_slider_and_video.sql` with indexes, triggers, explicit grants, RLS, public published-content reads, and staff-only management.
- Verification: `bun run typecheck` and `bun run lint` pass. Migration replay remains pending until applied to the configured Supabase instance.

## 2026-08-07 — Product statistics and centered mobile date

- Corrected the products-page interpretation by restoring a compact editable product list and adding four dedicated statistical cards for total, published, featured, and represented brands.
- Repositioned the Jalali date/time in the mobile admin topbar between the user identity and the physical-left logout button, and increased its size and weight for legibility.
- Verification: `bun run typecheck` and `bun run lint` pass.

## 2026-08-07 — Product cards and mobile admin topbar

- Removed the obsolete standalone `/admin/product-specifications` page; technical data remains exclusively inside the complete product editor.
- Reworked the products index into responsive visual cards with a large product thumbnail, localized names, publication status, compact closed state, and a full-width editor when opened.
- Rebuilt the mobile admin topbar with a two-line Jalali date/time display, removed “secure” from the logout label, and placed a compact red logout control on the physical left while retaining the menu trigger on the right.
- Verification: `bun run typecheck` and `bun run lint` pass.

## 2026-08-07 — Complete product editor and managed site identity

- Consolidated technical specifications, product catalogs/downloads, applications, icon-based features, and multi-image galleries into the product create/edit workflow; removed the duplicate technical-specification and catalog/file entries from admin navigation.
- Added repeatable product content cards with secure uploads, primary-image selection, bilingual image alt text, twelve approved SVG icon choices, bilingual applications/features, and typed downloads.
- Added product content tables, indexes, update triggers, explicit grants, public/published read policies, and staff management RLS in migration `20260807161124_product_content_and_site_identity.sql`.
- Connected managed features, gallery images, applications, specifications, and downloads to the public product detail experience, replacing hard-coded benefit and tab content when managed records exist.
- Added manager-only `/admin/site-settings` for bilingual site title/description, header/admin/login logos, favicon, default social image, and Google Search Console verification. Site metadata, favicon, verification, and social image now consume these settings with safe fallbacks.
- Verification: `bun run typecheck` and `bun run lint` pass. Migration replay remains pending until applied to the configured Supabase instance.

## 2026-08-07 — Async geography selection and second admin UI pass

- Replaced the representative form's 2,000+ city dropdown with an authenticated country → province → live city-search picker. Requests are debounced, limited to 25 results, show loading/empty/error states, and preserve the selected city while editing.
- Added the protected `/api/admin/locations` endpoint for incremental country, province, and city lookup without exposing privileged credentials or loading the complete city dataset into the browser.
- Changed `/admin/locations` so cities are searched asynchronously within the selected province and only the chosen city editor is rendered; country and province management remain visible as the stable hierarchy.
- Applied the refined admin design foundation to certificates, galleries, media assets, jobs, job applications, contact submissions, international inquiries, and downloadable files: clearer panel hierarchy, balanced forms, upload controls, record rows, statuses, spacing, and responsive layouts.
- Verification: `bun run typecheck` and `bun run lint` pass.

## 2026-08-07 — Catalog, locations, representatives, and request UX pass

- Unified the seven requested catalog and representative administration areas around clearer create/list panels, balanced bilingual fieldsets, consistent controls, compact expandable records, publication badges, and responsive action placement.
- Reduced product, category, brand, and representative form height by placing Persian and English fieldsets side by side on desktop and stacking them deliberately on mobile.
- Reworked the geography workspace into three visually distinct country, province, and selected-province city columns with stronger headings, larger controls, and responsive two-card/tablet and single-card/mobile behavior.
- Replaced the technical-specification redirect with an operational coverage overview showing Persian/English specification counts per product and a single route back to canonical product editing, avoiding duplicate data-entry interfaces.
- Redesigned representative applications as a review inbox with summary metrics, status filters, numbered request cards, structured applicant details, and a dedicated review panel.
- Affected routes: `/admin/brands`, `/admin/product-categories`, `/admin/products`, `/admin/product-specifications`, `/admin/locations`, `/admin/representatives`, and `/admin/representative-applications`.
- Verification: `bun run typecheck` and `bun run lint` pass.

## 2026-08-07 — Unified admin forms and FAQ management redesign

- Corrected the shared admin form foundation so catalog and settings forms use balanced two-column grids, consistent 48px controls, predictable full-width fields, aligned actions, stronger focus states, and a purpose-built single-column mobile layout.
- Completely rebuilt `/admin/faqs` with summary metrics, a collapsible create workflow, scannable numbered question cards, publication badges, bilingual fieldsets, aligned ordering/publication controls, and clearly separated save/delete actions.
- Improved shared create/list panels and editable rows across the remaining admin modules so the visual hierarchy and spacing no longer depend on each page's incidental field count.
- Verification: `bun run typecheck` and `bun run lint` pass.

## 2026-08-07 — Admin page-content workspace UI/UX redesign

- Rebuilt `/admin/translations` as a focused content workspace instead of a long stack of generic translation forms.
- Added a sticky page navigator, clear page summaries, balanced two-column content cards, human-readable field names, side-by-side Persian/English editors, restrained technical identifiers, and a secondary advanced-field area.
- Added responsive behavior: the page navigator becomes a horizontal touch list, language editors stack cleanly, and save actions become full-width on mobile.
- Improved hierarchy, spacing, typography, focus states, success/error feedback, and visual consistency with the admin design system.
- Verification: `bun run typecheck` and `bun run lint` pass. Browser visual QA could not run because no controllable browser was available in the current session.

## 2026-08-07 — Careers and recruitment applications

- Added bilingual job positions with department, employment type, location, description, requirements, publication dates, indexes, grants, and RLS.
- Added private résumé storage and a validated public application endpoint supporting both general talent-pool submissions and applications linked to a published position.
- Replaced simulated résumé submissions with persisted applications and tracking codes; added live public career filtering and dynamic SEO-ready job detail routes.
- Added operational `/admin/jobs` and `/admin/job-applications` screens. Migration: `20260807114230_careers_and_applications.sql`.

## 2026-08-07 — Certificates, galleries, and media library

- Added certificates, gallery albums/items, and central media-assets tables with publication controls, indexes, explicit grants, RLS, and secure Storage-backed file references.
- Seeded only the certificate and license identifiers supplied by the business, correcting the standard name to ASTM D3306.
- Added operational `/admin/certificates`, `/admin/galleries`, `/admin/media`, and filtered `/admin/files` interfaces with direct secure uploads instead of pasted file URLs.
- Migration: `20260807113356_certificates_gallery_files.sql`; updated generated database types and responsive administration CSS.

## 2026-08-07 — Public catalog and media database connection

- Added an idempotent content migration for the existing Dyar Shimi brand, four public product categories, and the currently presented verified product records.
- Updated catalog mapping to resolve each product's actual database brand instead of assigning a hard-coded brand.
- Connected the public media archive to published bilingual editorial records in Supabase, with the existing in-code content retained only as a connection/empty fallback.
- Migration: `20260807112755_seed_existing_public_content.sql`; affected `lib/catalog.ts`, `lib/media-content.ts`, and `/[lang]/media`.

## 2026-08-07 — Administration structural UX and secure uploads

- Increased administration typography and control sizing across navigation, dashboards, lists, forms, and mobile layouts.
- Consolidated duplicate news, articles, and media-category navigation into one `News & articles` workspace.
- Added a protected Supabase Storage bucket with MIME/size restrictions and staff-only mutation policies, plus an authenticated upload endpoint and reusable upload control; product images and datasheets no longer require pasted URLs.
- Replaced the disabled staff invitation control with operational manager-only user creation through the server-side Supabase Admin API, including strong-password validation, role selection, rollback on profile failure, and no browser exposure of the secret key.
- Migration: `20260807111348_secure_media_storage.sql`. Added server-only `SUPABASE_SECRET_KEY` configuration.

## 2026-08-07 — Manager bootstrap and editorial administration

- Added an idempotent Auth trigger/profile migration that promotes and activates an existing or subsequently created `admin@admin.com` Auth account without storing any password in source control.
- Added normalized media categories, editorial entries, and bilingual translations for news, articles, and guides, including SEO, cover/video/CTA fields, publication workflow, indexes, grants, and RLS.
- Added the responsive `/admin/editorial` creation workspace and routed news, articles, and media-category modules into it.
- Migrations: `20260807103335_promote_initial_manager.sql` and `20260807103428_editorial_content.sql`. No administrator password is embedded in migrations.

## 2026-08-07 — Operational representative applications

- Added a protected representative-application schema with generated/unique tracking codes, workflow statuses, review audit fields, indexes, explicit grants, and RLS allowing public insert but manager/admin-only reads and updates.
- Connected the public five-step form to a validated server endpoint and replaced the previous simulated tracking result with persisted submissions and cryptographically random tracking codes.
- Added a responsive admin review queue with application details, workflow status, and private internal notes.
- Migration: `20260807102848_representative_applications.sql`; affected `/api/representative-applications`, `/admin/representative-applications`, and the public representative application form.

## 2026-08-07 — Geography and representatives administration

- Added normalized country, province, city, and representative tables with validated hierarchy, map anchors, contact/location fields, indexes, updated-at triggers, explicit grants, and RLS.
- Public visitors can read only published records with a fully published parent chain; only active manager/admin roles can manage geography and representatives.
- Seeded only the verified country choices Iran and Iraq; no unverified representative or province data was invented.
- Added responsive hierarchical location management and operational representative CRUD with bilingual identity/address, phone, WhatsApp, coordinates, directions, ordering, and publication controls.
- Consolidated country, province, and city navigation into `/admin/locations`; added `/admin/representatives` for the network directory.
- Migration: `20260807101140_representatives_geography.sql`. Updated generated database types and admin CSS.
- Verification: `bun run typecheck` and `bun run lint` pass. Full local migration reset was attempted, but the local Supabase service is unavailable (`LegacyDbBootstrapError`).

## 2026-08-07 — Operational product and specification administration

- Added database-backed product creation and editing with validated brand/category relationships, SKU, image and datasheet paths, ordering, featured state, publication state, and bilingual content/SEO fields.
- Added bilingual technical-specification editing with ordered `label | value` rows, server validation, protected deletion, and public catalog revalidation after changes.
- Restricted assets to internal paths or HTTPS URLs and prevented incomplete newly-created products from remaining when translation persistence fails.
- Added responsive expandable product management UI with grouped category choices, product previews, and mobile-friendly long forms.
- Affected: `/admin/products` and admin catalog CSS. Existing catalog schema and RLS policies are reused; no database migration.

## 2026-08-07 — Operational product-category administration

- Added database-backed product-category creation and editing, linked to existing brands, with bilingual content, SEO fields, slugs, icon, accent color, display order, and publication state.
- Added server-side validation, role-controlled deletion, protection against deleting categories with products, and cleanup of incomplete records when translation persistence fails.
- Added responsive category list, expandable editing forms, publication indicators, and a required-brand empty state.
- Affected: `/admin/product-categories` and admin catalog CSS. Existing catalog schema and RLS policies are reused; no database migration.

## 2026-08-07 — Focused administration login identity

- Replaced the promotional and security-claim copy on the administration login screen with the Diyar Sanat identity and one concise system description.
- Removed the invitation notice and secondary login footer copy, and kept the brand visible in both desktop and mobile layouts.
- Affected: `/admin/login`, `components/admin-login-form.tsx`, `app/admin/login/page.tsx`, and admin login CSS. No database migration.

## 2026-08-07 — Operational brand administration

- Added database-backed brand creation and editing with Persian and English names, descriptions and SEO-friendly slugs, display ordering, and publication state.
- Added role-checked Server Actions, server-side validation, protected deletion for manager/admin roles, responsive list/edit interactions, and clear database error states.
- Refined mobile administration login into a unified branded composition with larger touch targets and stronger visual hierarchy.
- Affected: `/admin/brands`, admin login and catalog CSS. Existing catalog schema and RLS policies are reused; no database migration.

## 2026-08-07 — Secure administration foundation (phase 1)

- Added a separate no-index `/admin` application with a responsive Persian login experience, protected dashboard shell, Jalali dates, catalog/staff statistics, role-aware navigation, secure logout, and recent-login area.
- Replaced legacy profile roles with `manager`, `admin`, and `seo`; added active-state enforcement, immediate database-backed role checks, manager-only staff/settings policies, and hardened RLS helper functions.
- Added non-secret login settings for password/SMS/both, provider selection, OTP timing, CAPTCHA requirement, and a protected login-event audit table.
- Disabled public Auth signup and raised local password policy to 12 characters with upper/lowercase letters, digits, and symbols.
- Added server-only Kavenegar, SMS.ir, and IPPanel OTP provider adapters with strict Iranian mobile/OTP validation, timeouts, and environment-only credentials.
- Added role-aware module registry for every requested website domain, manager settings and staff-list screens, and staged module pages ready for CRUD implementation.
- No default admin account or hard-coded password was created. SMS OTP remains disabled until provider credentials/template and the Supabase Send SMS hook are configured.
- Affected: `/admin`, `components/admin-*`, `lib/admin/*`, `lib/sms/providers.ts`, `proxy.ts`, `.env.example`, `supabase/config.toml`, `supabase/migrations/20260807093656_admin_foundation.sql`, generated DB types, and admin CSS.
- Verification: `bun run typecheck` and `bun run lint` pass. Local migration reset was attempted but the local Supabase service/container was unavailable; production build passes.

## 2026-08-07 — Mobile products mega menu

- Added a touch-friendly, accessible products mega menu inside the mobile navigation drawer.
- Products now expand into brand-specific links for HAFMAN, Kentoil, and Dyar Shimi plus a clear “View all products” action.
- Added Escape/backdrop/close handling, body scroll locking, RTL-aware directional icons, and light/dark mobile styling.
- Affected: `components/mobile-menu.tsx`, `app/globals.css`. No database migration.
- Verification: `bun run typecheck`, `bun run lint`, and production build.

## 2026-08-07 — Turbopack JSON runtime recovery

- Diagnosed `Unexpected end of JSON input` as a stale/incomplete Turbopack development cache and HMR connection rather than application JSON parsing.
- Rebuilt the generated `.next` development cache and restarted the local Next.js development server cleanly.
- Verified the homepage plus FAQ, buying guide, and request-tracking routes return complete HTTP 200 responses after restart.
- No application or database behavior changed.

## 2026-08-07 — FAQ, buying guide, and request tracking

- Added localized, SEO-ready FAQ pages with categorized search, accessible accordions, and FAQPage structured data.
- Added a buying guide that clearly states the website does not sell online, directs visitors to verified representatives, explains product selection, and provides careful anti-counterfeit inspection guidance without claiming any single visual sign proves authenticity.
- Added a request-tracking page with tracking code, mobile, and CAPTCHA validation; it transparently reports that live lookup is not connected and does not send or store entered data.
- Connected customer-service footer links to the new routes and added all localized pages to the sitemap.
- Affected: `/[lang]/faq`, `/[lang]/buying-guide`, `/[lang]/request-tracking`, `components/support-tools.tsx`, `components/site-footer.tsx`, `app/sitemap.ts`, and `app/globals.css`. No database migration.
- Verification: `bun run typecheck`, `bun run lint`, and production build.

## 2026-08-06 — Product CTA wording

- Replaced “product archive” wording in the products mega menu and product-detail secondary action with the clearer localized “View all products” label.
- Affected: `components/header-navigation.tsx`, `app/[lang]/products/[slug]/page.tsx`. No database migration.
- Verification: `bun run typecheck` and `bun run lint`.

## 2026-08-06 — Product brand and category hierarchy

- Separated the product brand badge from the category and restyled categories such as engine oil and antifreeze as distinct, accessible chips.
- Improved spacing before the product title in desktop, mobile, and dark themes.
- Affected: `app/globals.css`. No database migration.
- Verification: `bun run typecheck` and `bun run lint`.

## 2026-08-06 — Removed brand-card numbering

- Removed the decorative 01/02/03 labels from homepage brand cards for a cleaner visual hierarchy.
- Affected: `app/[lang]/page.tsx`. No database migration.
- Verification: `bun run typecheck` and `bun run lint`.

## 2026-08-06 — Homepage brand-card UX refinement

- Redesigned the homepage brand cards with a calmer industrial layout, clearer identity hierarchy, a subtle localized Diyar Sanat watermark, and a dedicated directional CTA for each brand.
- Removed publication-status labels and avoided implying inventory; brand archives remain valid when their product list is empty.
- Updated Persian and English actions so each CTA explicitly names its brand.
- Affected: `app/[lang]/page.tsx`, `app/globals.css`. No database migration.
- Verification: `bun run typecheck`, `bun run lint`, and production build.

## 2026-08-06 — Theme switch and About navigation icon

- Replaced the compact icon/text theme button with a clear two-state sun/moon
  switch, animated selection thumb, visible light/dark state, keyboard focus,
  mobile sizing, and dark-surface styling.
- Replaced the Iran-map icon used for About in mobile bottom navigation with a
  neutral, recognizable information icon.
- Affected surfaces: global header and mobile bottom navigation. No database
  migration.
- Verification: `bun run lint`, `bun run typecheck`, and an isolated
  `bun run build -- --webpack` completed successfully.

## 2026-08-06 — Locale switcher and mobile footer/navigation refinement

- Replaced the FA/EN segmented control with a clearer single-action language
  switcher showing the active language, destination locale, and a visual
  language symbol; switching now preserves the current route.
- Replaced the unused Account destination in mobile bottom navigation with the
  real localized About route and an appropriate Iran/company icon.
- Returned mobile copyright and design credit to one aligned horizontal level,
  with balanced widths and RTL/LTR-aware end alignment.
- Affected surfaces: global header, mobile bottom navigation, and footer. No
  database migration.
- Verification: `bun run lint`, `bun run typecheck`, and an isolated
  `bun run build -- --webpack` completed successfully.

## 2026-08-06 — Mobile controls, footer, hero spacing, and dark-theme audit

- Replaced the one-way native-details mobile menu with a controlled accessible
  drawer that closes through its visible close button, backdrop, Escape key, or
  route navigation.
- Made the mobile theme control visually explicit with a compact action label
  and stronger day/night icon contrast.
- Replaced the homepage badge artwork with the complete Iran-shaped official
  flag asset and separated the badge from the highlights panel on desktop and
  mobile.
- Rebuilt the mobile footer into a clear single-column stack, removed text
  collisions, and moved Back to top into normal footer flow so it cannot cover
  legal or credit copy.
- Corrected the mobile bottom navigation so its active state follows the current
  route instead of always highlighting Home.
- Audited shared dark-mode surfaces across homepage, representatives, forms,
  careers, products, media, contact, About, navigation, and mobile bottom nav;
  added consistent dark backgrounds, borders, headings, body copy, and form
  controls while preserving media and brand accents.
- Affected surfaces: all localized public pages. No database migration.
- Verification: `bun run lint`, `bun run typecheck`, and an isolated
  `bun run build -- --webpack` completed successfully. Automated browser review
  was attempted, but no in-app or connected browser was available in the
  environment; the existing local development server remained untouched.

## 2026-08-06 — Browser-extension hydration warning suppression

- Added scoped hydration-warning suppression to the locale layout `body`
  element because browser extensions can inject attributes such as
  `cz-shortcut-listen` before React hydrates the server-rendered document.
- Kept the existing root direction/language structure unchanged and scoped the
  suppression to the exact externally mutated element rather than masking
  hydration differences throughout the application tree.
- Affected routes: all localized public pages. No database migration.
- Verification: `bun run lint` and `bun run typecheck` completed successfully.

## 2026-08-06 — Long-form article stress test and media UX refinement

- Added approximately 1,500 words of clearly labeled placeholder copy to each
  article template so typography, vertical rhythm, sticky contents navigation,
  lists, CTAs, and related content can be evaluated under realistic length.
- Increased and grouped publication date, reading time, and editorial identity
  into a high-contrast metadata surface suitable for desktop and mobile.
- Refined archive hierarchy so the lead story spans the full grid, secondary
  cards maintain equal structure, excerpts and headings clamp consistently,
  filters remain discoverable, and mobile shows every card vertically instead
  of hiding the archive behind horizontal scrolling.
- Improved long-form body width, paragraph size, line height, heading anchors,
  sample-content separation, and narrow-screen reading behavior.
- Affected routes: `/[lang]/media` and `/[lang]/media/[slug]`. No database
  migration.
- Verification: `bun run lint`, `bun run typecheck`, and an isolated
  `bun run build -- --webpack` completed successfully for all localized media
  routes.

## 2026-08-06 — SEO media archive and long-form article system

- Restored Media to the primary navigation and connected homepage journal cards
  and footer access to real localized media routes.
- Added a responsive archive for News, Blog, and Tutorial content with category
  filtering, text search, featured-story hierarchy, honest empty state, and
  direct canonical article URLs.
- Added long-form article pages supporting cover images, optional native video,
  semantic sections, sticky contents navigation, contextual CTA, related
  articles, breadcrumb navigation, and accessible responsive behavior.
- Added per-article metadata, Open Graph/Twitter fields, Article or NewsArticle
  JSON-LD, publisher/author identity, canonical URLs, static route generation,
  and sitemap discovery. Content avoids unverified product and export claims.
- Affected routes: `/[lang]/media` and `/[lang]/media/[slug]`, plus global
  navigation and homepage journal links. No database migration.
- Verification: `bun run lint`, `bun run typecheck`, and an isolated
  `bun run build -- --webpack` completed successfully; all eight localized
  article URLs were statically generated.

## 2026-08-06 — Product micro-interactions, archive hierarchy, and working search

- Replaced the simplified origin stripes with the complete Iran-shaped flag
  asset and elevated the key product specification into a dedicated technical
  badge instead of plain inline text.
- Reworked archive category headers and cards with category accents, structured
  labels, stronger specification chips, branded depth, clearer actions, and
  mobile-aware layouts.
- Added click/tap product-image zoom with a modal lightbox, Escape and backdrop
  dismissal, accessible labels, and preserved thumbnail selection.
- Replaced the inert header search icon with a keyboard-accessible site-search
  dialog and localized, filterable links to products and core public routes.
- Affected surfaces: global header, `/[lang]/products`, and
  `/[lang]/products/[slug]`. No database migration.
- Verification: `bun run lint`, `bun run typecheck`, and an isolated
  `bun run build -- --webpack` completed successfully.

## 2026-08-06 — Product-detail visual uplift and product mega menu

- Added an accessible desktop mega menu under Products with four product-group
  entry points, concise descriptions, archive CTA, route-aware active state,
  hover/focus-within behavior, and RTL/LTR mirroring.
- Enriched the product-detail hero with layered brand surfaces, a prominent
  Iran-flag origin badge, stronger product stage, branded background motif,
  elevated benefit/specification cards, and clearer purchase CTAs.
- Changed journal category labels (guide, blog, and news) to the requested red
  background with white text across featured and compact cards.
- Affected surfaces: global desktop header, homepage journal, and
  `/[lang]/products/[slug]`. No database migration.
- Verification: `bun run lint`, `bun run typecheck`, and an isolated
  `bun run build -- --webpack` completed successfully.

## 2026-08-06 — Product archive and product-detail experience

- Completed the localized product archive with category navigation, branded
  product mockups, responsive product cards, and direct SEO-friendly detail
  links instead of in-page placeholder anchors.
- Added dynamic product-detail routes sourced from the same catalog model, with
  breadcrumb and Product structured data, gallery, key facts, benefit summary,
  tabbed description/applications/features/technical/download states, contact
  CTA, archive return, and related products.
- Avoided publishing unverified API grades, approvals, packaging volumes, test
  results, or downloadable documents. The UI explicitly marks technical files
  as pending approved product datasheets.
- Added a representative product-detail URL to sitemap discovery and supplied
  mobile-specific archive scrollers and stacked product presentation.
- Affected routes: `/[lang]/products` and `/[lang]/products/[slug]`. No database
  migration.
- Verification: `bun run lint`, `bun run typecheck`, and an isolated
  `bun run build -- --webpack` completed successfully; the dynamic product
  detail route appears in the production route manifest.

## 2026-08-06 — About, contact map, international navigation, and CAPTCHA coverage

- Added a localized About route covering the company, factory and production
  direction, research and development, quality control, and future-market
  vision without publishing unverified capacities or export claims.
- Added International Cooperation to desktop/mobile menu content and changed
  About navigation from a homepage anchor to its dedicated route.
- Expanded Contact with typed email, phone/address verification states, and an
  OpenStreetMap view of the general Tabriz area. An exact marker is intentionally
  withheld until the employer supplies a verified full address.
- Applied an accessible arithmetic CAPTCHA to every active inquiry form,
  including representative applications, résumé intake, contact, and
  international cooperation.
- Added About to sitemap discovery and refined responsive contact/about layouts.
- Affected routes: `/[lang]/about`, `/[lang]/contact`, and all active public
  forms. No database migration.
- Verification: `bun run lint`, `bun run typecheck`, and an isolated
  `bun run build -- --webpack` completed successfully for all localized routes.

## 2026-08-06 — Contact, careers, and international cooperation routes

- Added localized contact, careers, general résumé detail, and international
  cooperation routes with canonical/hreflang metadata and sitemap discovery.
- Built responsive forms for departmental contact, general résumé intake, and
  international partnership inquiries, including requested attachments,
  consent controls, contact CAPTCHA, and native validation semantics.
- Added career department/work-type filters and an honest empty state because
  no employer-approved vacancies were supplied. A permanent general résumé
  route remains available without presenting a fictional job opening.
- Result states generate preview reference codes and clearly say that no request
  is persisted until the server-side intake is connected.
- Updated header, mobile navigation, and footer links for direct route access.
- Affected routes: `/[lang]/contact`, `/[lang]/careers`,
  `/[lang]/careers/general-application`, and
  `/[lang]/international-cooperation`. No database migration.
- Verification: `bun run lint`, `bun run typecheck`, and an isolated
  `bun run build -- --webpack` completed successfully for all localized routes.

## 2026-08-06 — Representatives page UX and accurate Iran provinces

- Replaced approximate Iran map points with the real SVG geometry of all 31
  provinces; the entire province surface is now the hover, keyboard-focus,
  active, and navigation target.
- Rebuilt the page context area with a dedicated, truncation-safe breadcrumb
  bar that supports long province names without overlap on desktop or mobile.
- Refined the page hero, elevated country/region controls, map surface, selected
  area header, empty state, spacing, contrast, and responsive hierarchy.
- Retained the dropdown-only mobile alternative and canonical province URLs,
  while adding source attribution for the MIT-licensed province geometry.
- Affected routes: `/fa/representatives/**` and `/en/representatives/**`. No
  database migration was required.
- Verification: `bun run lint`, `bun run typecheck`, and a clean isolated
  `bun run build -- --webpack` pass. The standard `.next` directory was still
  holding a temporary test-log handle, so verification used a disposable build
  output directory that was removed afterward.

## 2026-08-06 — Header navigation redesign and representatives runtime fix

- Replaced the loose desktop links with a compact navigation surface using
  consistent hit areas, restrained hover feedback, a clear active pill, and a
  red route indicator. Active state now follows the real pathname instead of
  permanently highlighting Home.
- Refined header translucency, spacing, shadow, and the representative CTA while
  preserving the established logo, language control, theme control, RTL/LTR
  mirroring, keyboard focus, and mobile menu.
- Fixed the representatives page runtime failure by replacing `Map.groupBy`,
  which was unavailable in the current server runtime, with a compatible typed
  reducer. Header and mobile links now reach the route normally.
- Affected routes: all public routes and `/[lang]/representatives/**`. No
  database migration was required.
- Verification: `bun run lint`, `bun run typecheck`, and
  `bun run build -- --webpack` pass; the production route manifest includes the
  representatives catch-all route after the runtime-incompatible call removal.
  A temporary production server returned HTTP 200 for both
  `/fa/representatives` and
  `/fa/representatives/iran/east-azerbaijan` with complete rendered HTML.

## 2026-08-06 — SEO-ready Iran and Iraq representatives finder

- Added a localized representatives route supporting the index, country, and
  province/governorate URLs, including
  `/fa/representatives/iran/east-azerbaijan`.
- Built desktop Iran/Iraq tabs, an accessible SVG map with hover, focus, and
  active states, and a results panel designed to group approved records by city.
- Added mobile country and province selects as a complete map alternative; both
  controls navigate to canonical URLs instead of hiding filter state in client
  memory.
- Added all 31 Iranian provinces and 19 Iraqi governorates to the navigation
  model. Representative records remain intentionally empty until employer-
  approved names, managers, addresses, phones, WhatsApp numbers, and directions
  are supplied; the page communicates that state without publishing samples.
- Updated header, representative CTA, mobile navigation, sitemap, localized
  metadata, breadcrumbs, and map-source attribution.
- Affected routes: `/fa/representatives/**` and `/en/representatives/**`. No
  database migration was required.
- Verification: `bun run lint`, `bun run typecheck`, and
  `bun run build -- --webpack` pass. The build registers the optional catch-all
  representatives route successfully.

## 2026-08-06 — Fully visible mobile trust grids

- Removed horizontal scrolling from the homepage highlights and credentials on
  mobile so all five items are discoverable without swipe gestures.
- Reflowed both sections into compact two-column grids with the fifth item
  spanning the full row, preserving a balanced silhouette and clear completion.
- Tightened mobile icon, type, and spacing scales while retaining readable
  labels, full identifiers, RTL/LTR structure, and narrow 360px support.
- Affected routes: `/fa` and `/en`. No database migration was required.
- Verification: `bun run lint`, `bun run typecheck`, and
  `bun run build -- --webpack` pass.

## 2026-08-06 — News section editorial hierarchy refinement

- Reworked the equal-weight news cards into an editorial layout with one large
  lead story and three compact supporting stories, making priority and scanning
  order immediately clear.
- Replaced the lead story's product-packaging thumbnail with the existing
  factory teaser image so the section reads as company media rather than a
  duplicate product catalog.
- Reduced repeated metadata on compact cards, constrained long headings,
  enlarged the lead-story action, and preserved full-card image links plus
  keyboard focus behavior.
- Kept mobile purpose-built as a snap scroller with a wider lead card, stable
  touch targets, and consistent reading order in RTL and LTR.
- Affected routes: `/fa` and `/en`. No database migration was required.
- Verification: `bun run lint`, `bun run typecheck`, and
  `bun run build -- --webpack` pass.

## 2026-08-06 — Editorial news and verified credentials redesign

- Corrected the teaser play glyph to point physically right in both RTL and LTR
  layouts.
- Rebuilt the news area with editorial image cards, compact reading metadata,
  equal-height content, clearer article actions, accessible linked covers, and
  a refined all-news CTA with stronger keyboard and hover feedback.
- Replaced pending credential placeholders with five employer-supplied records:
  Iran National Standard 338, ASTM D3306, standard number 10001517, operating
  license 7206290, and business number 12452916074.
- Redesigned credentials as a high-contrast trust panel with scannable labels,
  isolated LTR identifiers, restrained category accents, and a touch-friendly
  mobile scroller. No third-party certification logo was implied.
- Affected routes: `/fa` and `/en`. No database migration was required.
- Verification: `bun run lint`, `bun run typecheck`, and
  `bun run build -- --webpack` pass.

## 2026-08-06 — Factory teaser and visual-number cleanup

- Removed decorative numbering from both the homepage highlight tiles and the
  product cards to reduce visual noise and keep attention on content.
- Rebuilt the company introduction as a responsive editorial section with a
  concise intro, a large cinematic teaser cover, clear play affordance, player
  styling, and a supporting four-item value grid.
- Generated an original, text-free industrial teaser cover specifically for the
  section and kept all captions in accessible HTML rather than inside the image.
- Refined hierarchy, contrast, touch sizing, RTL/LTR behavior, responsive grid
  collapse, and reduced-motion compatibility. The player is presentation-ready;
  an approved video source can be connected when supplied.
- Affected routes: `/fa` and `/en`. No database migration was required.
- Verification: `bun run lint`, `bun run typecheck`, and
  `bun run build -- --webpack` pass.

## 2026-08-06 — Product-card UX audit and CTA refinement

- Replaced the straight emphasis underline with a centered, symmetric red mark that tapers at both ends and remains thickest beneath the middle of “عملکرد بهتر.”
- Redesigned the all-products CTA as a high-contrast navy action with a dedicated directional affordance, stronger touch target, hover/focus feedback, and locale-aware padding.
- Audited the product cards for equal heights, content alignment, contrast, keyboard focus, mobile scrolling, directional behavior, and motion. Cards now use flex-based equal-height content, bottom-aligned actions, protected heading space, darker accessible gold/blue accents, and matching hover/focus-within states.
- Affected routes: `/fa` and `/en`. No database migration was required.
- Verification: `bun run lint`, `bun run typecheck`, and `bun run build -- --webpack` pass.

## 2026-08-06 — Branded product mockups and premium product cards

- Replaced the CSS placeholder bottles with four original product mockups for engine oil, gear oil, brake fluid, and antifreeze, each using the employer-supplied DST logo as the mandatory brand reference.
- Rebuilt the product cards with larger editorial imagery, numbered glass labels, category icon badges, color-coded edge accents, elevated shadows, hover depth, and circular directional actions.
- Changed the Persian section label from “دیار شیمی” to “محصولات ما” and added a red emphasis underline beneath “عملکرد بهتر” in the main heading; added equivalent English copy.
- Kept generated packaging free from unverified specifications, certificates, statistics, and performance claims.
- Affected routes: `/fa` and `/en`. No database migration was required.
- Verification: `bun run lint`, `bun run typecheck`, and `bun run build -- --webpack` pass. The four final web assets were resized to 900×900 JPEGs for delivery efficiency.

## 2026-08-06 — Desktop hero set to 600px

- Set the desktop hero and photo height to exactly 600px, up from 555px.
- Preserved the existing purpose-built mobile heights.
- Affected routes: `/fa` and `/en`. No database migration was required.
- Verification: `bun run lint`, `bun run typecheck`, and `bun run build -- --webpack` pass.

## 2026-08-06 — Additional desktop hero height

- Increased the desktop hero and photo height by another 50px, from 505px to 555px.
- Preserved the existing 390px and 330px purpose-built mobile heights.
- Affected routes: `/fa` and `/en`. No database migration was required.
- Verification: `bun run lint`, `bun run typecheck`, and `bun run build -- --webpack` pass.

## 2026-08-06 — Desktop hero height and badge corner direction

- Increased the desktop hero and photo height from 490px to 505px while leaving the purpose-built mobile heights unchanged.
- Removed the RTL corner reversal from the Made in Iran badge: its physical left edge is square and its two right corners, facing into the image, remain rounded in both locales.
- Affected routes: `/fa` and `/en`. No database migration was required.
- Verification: `bun run lint`, `bun run typecheck`, and `bun run build -- --webpack` pass.

## 2026-08-06 — Physical left badge fix and segmented language switcher

- Corrected the Made in Iran badge with physical `left` and `bottom` positioning so Persian direction can no longer move it to the image's right edge.
- Replaced the header language dropdown with a compact, always-visible `FA | EN` segmented control modeled after the supplied reference, with a clear active state and direct one-click switching.
- Kept accessible language labels, `hrefLang`, language metadata, focus states, and a compact mobile treatment.
- Affected routes: `/fa` and `/en`. No database migration was required.
- Verification: `bun run lint`, `bun run typecheck`, and `bun run build -- --webpack` pass.

## 2026-08-06 — Hero cleanup and professional header language control

- Pinned the Made in Iran badge directly to the physical left edge of the hero on desktop and mobile.
- Reduced the Persian hero copy's right-side padding and removed its width cap to eliminate the unused right gutter.
- Removed the duplicate hamburger menu and language/theme controls from inside the hero.
- Replaced the single-language header link with an accessible two-option language menu showing the active language, locale code, and clear Persian/English choices.
- Affected routes: `/fa` and `/en`. No database migration was required.
- Verification: `bun run lint`, `bun run typecheck`, and `bun run build -- --webpack` pass.

## 2026-08-06 — Fixed physical hero placement and shared Iran SVG

- Set the desktop hero to a physical LTR grid so the image remains on the left and copy remains on the right on Persian routes, while the copy itself keeps correct RTL reading direction.
- Removed the image mirror transform; the factory image now keeps its natural orientation while occupying the requested left side.
- Replaced the improvised CSS gear with the established detailed gear icon from the site icon system.
- Added one accurate CC0 SVG map of Iran and replaced abstract Iran icons in the hero highlights and footer credentials with a shared reusable map component.
- Affected routes: `/fa` and `/en`. No database migration was required.
- Verification: `bun run lint`, `bun run typecheck`, and `bun run build -- --webpack` pass.

## 2026-08-06 — Exact reference hero and accurate Iran mark

- Tightened the desktop hero proportions, circular photo crop, typography, CTA ordering, dotted technical background, slide indicators, and embedded language/menu controls to match the supplied close-up reference.
- Replaced the abstract Iran icon in the Made in Iran badge with an accurate public-domain flag map of Iran sourced from Wikimedia Commons, paired with the reference-style industrial gear.
- Preserved the exact approved Persian message “ساخت ایران، حرکت به جلو” and the safe future-market positioning.
- Affected routes: `/fa` and `/en`. No database migration was required.
- Verification: `bun run lint`, `bun run typecheck`, and `bun run build -- --webpack` pass.

## 2026-08-06 — Persian hero mirroring and reference-matched footer

- Explicitly placed Persian hero copy on the right and the industrial image on the left, with a horizontal image mirror on RTL desktop layouts.
- Rebuilt the Made in Iran badge with a dedicated Iran outline, three-color Iranian flag, and the exact approved “ساخت ایران، حرکت به جلو” message.
- Expanded the footer to match the supplied reference structure: newsletter bar, five information columns, contact details, pending credentials, customer-service links, product links, quick access, legal bar, and back-to-top control.
- Kept unverified phone and licensing details visibly pending rather than publishing fabricated values.
- Affected routes: `/fa` and `/en`. No database migration was required.
- Verification: `bun run lint`, `bun run typecheck`, and `bun run build -- --webpack` pass.

## 2026-08-06 — Reference-led homepage visual rebuild

- Rebuilt the Persian and English homepage presentation to closely follow the supplied desktop reference: compact branded navigation, split industrial hero, overlapping highlight panel, four product-category cards, three-column factory story, four-item media row, credential strip, newsletter, and structured footer.
- Added purpose-built mobile behavior with horizontal product, metric, media, and credential scrollers while preserving structural RTL/LTR mirroring and the mobile bottom navigation.
- Kept all public claims within verified project facts; numerical export, representative, award, certificate, and capacity claims from the visual reference were intentionally not copied.
- Added a project-specific social preview card and wired Open Graph and X metadata to it.
- Affected routes: `/fa` and `/en`. No database migration was required.
- Verification: `bun run lint`, `bun run typecheck`, and `bun run build -- --webpack` pass. The production build required execution outside the managed runner after its first child-process spawn was denied with `EPERM`.

## 2026-08-06 — RTL hero placement and Supabase seed verification

- Corrected the desktop hero’s logical auto margin so Persian content occupies
  the right side and English content remains on the left without physical
  left/right CSS overrides.
- Supabase verification: pending migration replay, seed, RLS/API checks, and
  application catalog read.

## 2026-08-06 — Locale-aware typography and bidirectional layout

- Added the project-supplied IRANYekanX Pro variable WOFF2 fonts via
  `next/font/local`.
  Persian routes use the FaNum face for Persian digits; English routes use the
  standard face for Latin digits. Eager preload is disabled so each locale only
  downloads the face it actually applies.
- Reduced the supplied font bundle to the two production web fonts and retained
  its license notice beside them; removed static, desktop, demo, and metadata
  files that are not shipped by the application.
- Audited shared directionality beyond text alignment: CTA groups and header
  controls now mirror by locale, directional chevrons flip in RTL, mobile menu
  content restores the document direction, intrinsically LTR email content is
  isolated, and mobile navigation ordering mirrors around the centered home
  action.
- Updated the permanent agent and product-context rules so future shared UI work
  must preserve FaNum/LTR numerals and structural RTL behavior.
- Affected routes: `/fa`, `/en`, `/fa/products`, and `/en/products`. No database
  migration was required.
- Verification: `bun run lint`, `bun run typecheck`, and
  `bun run build -- --webpack` pass. The optimized CSS contains both variable
  faces with locale-selectable font variables and no eager preload. A new local
  runtime preview could not bind a port in the managed runner (`listen EPERM`),
  so this pass did not add browser-based visual QA.

## 2026-08-06 — Foundation, catalog, and first responsive routes

- Added durable contributor instructions and consolidated the employer’s
  information architecture and design system into `docs/PROJECT_CONTEXT.md`.
- Standardized Bun as the only package manager and pinned Supabase CLI 2.111.0.
- Initialized the production-replayable Supabase layout and added the first
  catalog migration, RLS policies, explicit Data API grants, and development
  seed content for the four verified product groups.
- Added typed browser/server Supabase client utilities and a server-side catalog
  repository with a visible, safe fallback when migrations have not yet been
  deployed to the temporary remote project.
- Added locale-prefixed `/fa` and `/en` routing, with `/` redirected to `/fa`.
- Implemented the responsive homepage and product listing route from shared
  components, including desktop navigation, mobile navigation, theme control,
  structured metadata, sitemap, robots, and accessible interaction states.
- Added an AI-generated, brand-neutral industrial hero asset. It is a temporary
  visual and must be replaced with approved factory photography when available.
- Verification: `bun run lint` and `bun run typecheck` pass; the Next.js 16.3
  production build passes with the documented `--webpack` fallback. The default
  Turbopack build cannot bind its CSS worker port in the managed runner. The
  configured Supabase Auth health endpoint is reachable with the publishable
  key. Local `db:reset` is pending because Docker is not running. In-app visual
  QA was not completed because browser access to the local preview was declined.
## 2026-08-06 — Homepage highlight strip UI/UX redesign

- Rebuilt the five homepage highlights below the hero as a semantic list with a
  stronger title/detail hierarchy, restrained color coding, consistent icon
  containers, and quiet numeric wayfinding.
- Reworded the labels for clearer product, production, process, support, and
  growth messaging without adding unverified statistics or market claims.
- Replaced separator-only columns with balanced information tiles while keeping
  them visibly non-interactive, so the cards do not imply unavailable links.
- Added an RTL/LTR-safe, touch-friendly mobile scroller with snap alignment,
  contained overscroll, compact spacing, and hidden scrollbars.
- Affected routes: `/fa` and `/en`. No database migration was required.
- Verification: `bun run lint`, `bun run typecheck`, and
  `bun run build -- --webpack` pass.
## 2026-08-06 — Iraq map and representative application flow

- Replaced approximate Iraq map points with selectable SVG governorate
  boundaries. Kept Halabja in the country/region selector rather than drawing an
  unverified border absent from the licensed geometry source.
- Added a responsive partnership banner below the representatives workspace and
  connected its CTA, plus the global header CTA, to the new localized
  representative-application route.
- Built a five-step accessible application experience for personal, business,
  distribution, document, and review information, followed by an explicit
  confirmation state and generated reference code. The current result clearly
  states that persistence still needs a database connection and does not imply
  that a request was transmitted.
- Added localized metadata, canonical URLs, sitemap entries, responsive states,
  keyboard focus behavior, validation feedback, and map-source attribution.
- Affected routes: `/[lang]/representatives/**` and
  `/[lang]/representative-application`. No database migration.
- Verification: `bun run lint`, `bun run typecheck`, and an isolated
  `bun run build -- --webpack` all completed successfully. The isolated output
  was used because an unrelated running process held a legacy `.next` log open.
# 2026-08-06 — Brand portfolio across homepage and product journeys

- Added a shared, localized brand model for HAFMAN, Kentoil, and Dyar Shimi and connected it to catalog products.
- Added a responsive “Our brands” section to the homepage with distinct visual identities and honest publication states.
- Reworked the products mega menu around brands, with direct brand-filtered archive links.
- Added accessible brand filters and empty states to the product archive; existing verified catalog items are assigned to Dyar Shimi, while no unverified HAFMAN or Kentoil products are invented.
- Added consistent brand chips to archive cards and an enhanced brand label plus dynamic Product structured data on product-detail pages.
- Affected: `lib/brands.ts`, `lib/catalog.ts`, `components/header-navigation.tsx`, `components/product-card.tsx`, `app/[lang]/page.tsx`, `app/[lang]/products/page.tsx`, `app/[lang]/products/[slug]/page.tsx`, `app/globals.css`.
- Verification: `bun run typecheck`; `bun run lint`; production build.
# 2026-08-07 — Contact submissions, translations, and managed SEO

- Replaced the contact form's preview-only confirmation with a real server-side submission flow, validated fields, consent, captcha, private optional attachment upload, database persistence, and a durable tracking code.
- Added the operational `/admin/contact-submissions` inbox with review status and internal notes for manager/admin roles.
- Added bilingual keyed translations management at `/admin/translations`, including safe namespace/key validation and public read access for future incremental frontend adoption.
- Added route- and locale-specific SEO management at `/admin/seo` for titles, descriptions, canonical URLs, robots directives, Open Graph images, and validated JSON structured data.
- Connected the contact page metadata to managed SEO values with existing hard-coded metadata retained as a safe fallback when the migration or record is absent.
- Added migration `20260807115250_contact_translations_seo.sql` with explicit grants, RLS, lookup indexes, update triggers, and the private `contact-attachments` Storage bucket.
- Affected routes: `/fa/contact`, `/en/contact`, `/admin/contact-submissions`, `/admin/translations`, `/admin/seo`, and `/api/contact-submissions`.
- Verification: `bun run typecheck` and `bun run lint` pass. Database replay remains pending until the migration is applied to the configured Supabase instance.
# 2026-08-07 — International inquiries and private representative documents

- Replaced the international-cooperation preview form with a real multipart submission flow, server validation, required captcha and consent, private company-profile upload, database persistence, and a generated tracking code.
- Added `/admin/international-inquiries` with role-limited review states and internal notes, and exposed it in the requests navigation group.
- Upgraded representative applications from JSON-only submission to trusted server-side multipart handling; optional business documents now upload to a private bucket and their paths are persisted with the application.
- Removed anonymous/direct Data API inserts for representative applications. Both public forms now write through validated server routes using the server-only Supabase secret.
- Added migration `20260807120725_international_inquiries_and_private_documents.sql` with explicit grants, RLS, review indexes, and private `international-profiles` and `representative-documents` buckets.
- Affected routes: `/fa/international-cooperation`, `/en/international-cooperation`, `/api/international-inquiries`, `/api/representative-applications`, and `/admin/international-inquiries`.
- Verification: `bun run typecheck` passes. Full migration replay remains pending until the migration is applied to the configured Supabase instance.
# 2026-08-07 — Idempotent catalog seed conflict fix

- Fixed the catalog seed migration after an existing localized product slug triggered `product_translations_locale_slug_key` during replay.
- Product translation upserts now target the actual unique route identity `(locale, slug)` and reconnect the translation to the canonical SKU-selected product instead of conflicting on a stale product ID.
- Updated all three seeded product translation statements so repeated migration/seed execution follows the same deterministic behavior.
- Affected migration: `20260807112755_seed_existing_public_content.sql`. No schema or RLS change.
- Verification: confirmed every seeded product translation now uses `on conflict(locale,slug)`.
# 2026-08-07 — Unified geography, managed navigation, and brand sync

- Consolidated the three duplicate admin navigation entries for countries, provinces, and cities into the existing unified `/admin/locations` workspace; legacy routes continue redirecting there.
- Added idempotent seed data for Iran and Iraq, all 31 Iranian provinces and 19 Iraqi governorates (including Halabja as used by the public selector), and an official administrative-center city for each region. No representative records were fabricated.
- Synchronized the public brand portfolio with the database by adding published HAFMAN and Kentoil records and bilingual translations, while preserving Dyar Shimi and leaving unverified product lists empty.
- Added a bilingual `navigation_items` model with header/footer placement, hierarchy, ordering, publication controls, RLS, explicit grants, and initial navigation seed data.
- Built `/admin/menus` and connected published root navigation items to both the public header and footer, with safe in-code fallbacks before the migration is deployed.
- Updated the products mega-menu trigger to detect the products route rather than relying on a fragile fixed menu index, so admin reordering does not break it.
- Added migration `20260807122819_locations_brands_navigation.sql` and updated generated database types.
- Verification: `bun run typecheck` and `bun run lint` pass. Migration replay remains pending until applied to the configured Supabase instance.
# 2026-08-07 — Comprehensive Iran and Iraq city dataset

- Added an idempotent city-data migration generated from the GeoNames IR/IQ country dumps (CC BY 4.0), restricted to populated places with a recorded population of at least 1,000 plus all administrative seats so villages and unnamed geography do not overwhelm the selector.
- Added 2,119 localized city records: 1,951 for Iran and 168 for Iraq, mapped across all 31 Iranian provinces and 19 Iraqi governorates.
- Persian/Arabic names are selected from the source alternate names where available; stable collision-free slugs include the GeoNames identifier.
- Redesigned `/admin/locations` city management to load one selected province at a time, preventing thousands of edit forms from rendering simultaneously while retaining country, province, and city creation/editing in one workspace.
- Added migration `20260807124116_seed_iran_iraq_cities.sql`. No new public claims or representative records were introduced.
- Verification: validated record counts and coverage of all 50 administrative regions; `bun run typecheck` and `bun run lint` pass. Database replay remains pending until the migration is applied.
# 2026-08-07 — Page-oriented bilingual content management

- Expanded the existing translation store into a page-oriented content workspace at `/admin/translations`, grouping editable Persian and English fields by homepage, about, contact, FAQ, buying guide, international cooperation, and the global footer.
- Connected managed content to the homepage hero, Made-in-Iran badge, product heading, factory introduction, footer contact headings/details, contact page, and shared inner-page heroes while preserving safe in-code fallbacks before migrations are deployed.
- Added a dedicated bilingual FAQ model and `/admin/faqs` CRUD workspace with category, question, answer, ordering, publication status, public read policy, and staff-only management.
- Added idempotent starter content for both locales in migration `20260807125322_editable_page_content_and_faqs.sql`; no unverified company claims were introduced.
- Affected routes: `/fa`, `/en`, `/[lang]/about`, `/[lang]/contact`, `/[lang]/faq`, `/[lang]/buying-guide`, `/[lang]/international-cooperation`, `/admin/translations`, and `/admin/faqs`.
- Verification: `bun run typecheck` and `bun run lint` pass. Full database replay remains pending until a local container runtime is available or the migration is applied to the configured Supabase instance.
