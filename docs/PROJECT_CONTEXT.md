# Diyar Sanat Tabriz — project context

This file is the shared product and architecture source of truth. Read it before
planning or implementing work.

## Product

Diyar Sanat Tabriz is an industrial manufacturer with the Diyar Shimi brand.
The website is the official source for the company, four automotive-fluid
product groups, representatives, representative applications, media, technical
content, certificates, careers, contact, and future international cooperation.

The company is new and has not started active exports. Never present export
counts, representative counts, awards, standards, production capacity, or
customer numbers unless the employer supplies verifiable evidence. Preferred
positioning: “Made in Iran, moving forward” and “on the path toward regional and
global markets.”

## Experience and design system

- Visual character: industrial, precise, Iranian, trustworthy, modern, and
  premium without decorative luxury.
- Palette: Primary 900 `#0A2240`, Primary 700 `#164B82`, Primary 500 `#2877BD`,
  Accent 600 `#D12632`, Neutral 950 `#101820`, Neutral 700 `#40505F`, Neutral 200
  `#E4E8EB`, Neutral 50 `#F7F9FA`, White `#FFFFFF`.
- Red is reserved for one priority CTA per viewport. Navy carries identity and
  trust. Most page area remains white or very light gray.
- Typography uses the project-supplied proprietary IRANYekanX Pro variable web
  fonts through `next/font/local`: the FaNum build on `/fa` renders Persian
  digits, while the standard build on `/en` preserves Latin digits. Keep the
  license notice beside the font assets and use Tahoma/Arial only as fallback
  fonts.
- Persian pages inherit `lang="fa"` and `dir="rtl"` at the document root. RTL is
  structural: shared navigation, grids, horizontal scrollers, calls to action,
  breadcrumbs, and directional icons must mirror their LTR ordering. Prefer
  logical CSS properties and explicitly isolate email addresses, technical
  codes, and other intrinsically LTR values.
- Desktop: 1280px content container, 12 columns, 24px gutters. Tablet: 8
  columns, 24px margins. Mobile: 4 columns, 16px margins, 12px gutters.
- Spacing scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 120.
- Cards generally use 12px radii, buttons and inputs 8px. Default border is
  `#E4E8EB`. Motion lasts 180–300ms, uses ease-out, respects reduced motion, and
  avoids heavy parallax.
- Accessibility baseline: WCAG AA contrast, 44×44 touch targets, visible focus,
  one H1 per page, semantic H2/H3 hierarchy, alt text, and useful loading/empty/
  error states.
- Mobile is a purpose-built layout, not a scaled desktop page. Product cards can
  scroll horizontally and the five-item bottom navigation appears only on
  mobile.

## Routing and content architecture

- Locale roots: `/fa` and `/en`.
- Initial implementation: homepage and `/[lang]/products`.
- Planned routes: about, product details, representatives by country/province,
  representative application, international cooperation, certificates, media
  (news/blog/gallery), careers, contact, downloads, search, FAQ, legal pages,
  privacy, and error pages.
- Product navigation follows brand → category → product and becomes a nested
  accordion on mobile.
- Primary product groups: engine oil, gear oil, brake fluid, and antifreeze.
- Representative discovery needs an accessible province/country selector in
  addition to the SVG map. Province URLs must remain indexable.
- Long application forms are multi-step, resumable, and end with a visible
  tracking code.

## Architecture

- Next.js App Router, TypeScript strict mode, Tailwind CSS, Server Components by
  default, and locale-prefixed routing.
- PostgreSQL 17 is the system of record; Drizzle defines the schema, inferred
  types, parameterized SQL, and migrations. pnpm is the package manager.
- `lib/db/server.ts` provides a server-only repository for existing content
  workflows. Every operation uses a pooled connection and a transaction-local
  visitor/staff role plus a verified user ID; the original RLS policies remain
  database-enforced. `lib/db/admin.ts` is limited to trusted server operations.
- `lib/auth/` stores bcrypt passwords and hashed opaque session tokens in the
  private schema. Roles and active status come from `profiles` on every request.
  SMS login calls the existing Kavenegar, SMS.ir, or IPPanel adapters directly.
- Files live in a persistent upload volume. `/api/files/` streams public media
  with video range support and checks manager/admin access for private files.
- `drizzle/0000_postgres_baseline.sql` recreates the full content schema, original
  seed data, indexes, constraints, triggers, and adapted RLS without Supabase.
  Future schema changes start in `lib/db/schema.ts` with reviewed Drizzle SQL.
- Dokploy deploys the root `Dockerfile` as a single Application. `DATABASE_URL`
  points to the user's existing PostgreSQL service. The image runs migrations
  before starting Next.js; it does not provision a PostgreSQL service or an
  additional database login. All queries still select restricted roles inside
  transactions. Persist `/app/data/uploads` with a Dokploy volume mount.
- The Supabase import command supports a dry run, preserves IDs and password
  hashes, copies files, and rewrites public file URLs. See `docs/DEPLOYMENT.md`.
- Original migrations remain archived under `docs/legacy-supabase/` for audit
  and source-database comparison; they are not used by the running application.

## Source material

The employer’s Persian brief and these files are the original design inputs:

- `Diar_Sanat_Design_System_FA.docx`
- `Diar_Sanat_Information_Architecture_FA.docx`
- desktop and mobile homepage reference screenshots supplied on 2026-08-06

The supplied DOCX files remain the authority if a summary here is ambiguous.
