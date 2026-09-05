<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Diyar Sanat project rules

Read `docs/PROJECT_CONTEXT.md` and `docs/DEVELOPMENT_LOG.md` before changing the
application. They are the product and implementation memory for Codex, Claude,
IDE agents, and human contributors.

## Non-negotiable engineering rules

- pnpm is the only JavaScript package manager on this branch. Use `pnpm add`,
  `pnpm remove`, and `pnpm run`; commit `pnpm-lock.yaml`. Do not create Bun, npm,
  or Yarn lockfiles. This supersedes the original Bun convention.
- Before editing Next.js code, read the relevant guide in
  `node_modules/next/dist/docs/` for the installed version.
- Load and follow both Supabase agent skills in `.agents/skills/` before any
  Supabase or Postgres work.
- PostgreSQL and Drizzle are the backend. Edit `lib/db/schema.ts`, generate and
  review migrations in `drizzle/`, and run `pnpm db:migrate` on a fresh local
  PostgreSQL database. Types are inferred from the Drizzle schema. Preserve
  explicit grants, RLS, and handwritten functions/triggers in SQL migrations.
- All exposed tables require explicit grants and Row Level Security. Never use a
  service-role or secret key in browser code, and never use user-editable
  metadata for authorization.
- The production target is a single Dokploy Dockerfile application using the
  existing external PostgreSQL service through `DATABASE_URL`. The image runs
  migrations on startup, then starts standalone Next.js. Do not add a Compose
  stack or provision another database/login. All application queries retain
  transaction-local restricted roles and RLS. Persist `/app/data/uploads`.
  Archived Supabase migrations in `docs/legacy-supabase/` are historical only.
- Prefer Server Components. Add Client Components only at interactive
  boundaries. Keep database access in `lib/` and presentation in `components/`.
- The public website is locale-prefixed (`/fa`, `/en`), Persian is RTL, and all
  public pages need semantic headings, accessible focus states, and SEO
  metadata.
- Locale direction is structural, not just text alignment. `/fa` must inherit
  `lang="fa"` and `dir="rtl"`, use the local IRANYekanX FaNum variable font, and
  mirror component order, navigation flow, grids, carousels, and directional
  icons. `/en` must inherit `lang="en"` and `dir="ltr"`, use the standard-digit
  IRANYekanX variable font, and preserve Latin numerals. Prefer CSS logical
  properties and test both locales whenever shared layout code changes.
- Do not publish unverified statistics, export claims, certificates, agents, or
  customer counts. “Global markets” is a direction, not a claim of active
  exports.
- Update `docs/DEVELOPMENT_LOG.md` in the same change for every feature, bug fix,
  schema change, or architectural decision. Record what changed, why, affected
  files/routes, migrations, and verification performed.
