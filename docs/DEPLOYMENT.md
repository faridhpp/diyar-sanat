# Dokploy deployment and Supabase cutover

## New installation

1. Push the `next` branch to the repository used by Dokploy. Create a **Docker
   Compose** service (not Docker Stack), select that branch, and set the Compose
   path to `docker-compose.yml`.
2. In Dokploy's Environment editor set `POSTGRES_PASSWORD`,
   `DATABASE_APP_PASSWORD`, and `APP_URL=https://your-domain`. Generate two
   distinct passwords with `openssl rand -hex 32`. Hex passwords work directly
   in the Compose connection URLs. Do not reuse the PostgreSQL owner password
   for the application.
3. Add a domain to the `web` service, container port **3000**, and enable HTTPS.
   Match `APP_URL` exactly to the browser's origin; authenticated POSTs reject
   other origins. Do not publish PostgreSQL's port to the internet.
4. Deploy. PostgreSQL's healthcheck must pass before migrations run. The web
   service starts only after migrations succeed. `/api/health` checks database
   access. Builds do not require database or Supabase credentials.
5. To create the first manager, temporarily set `BOOTSTRAP_ADMIN_EMAIL`,
   `BOOTSTRAP_ADMIN_PASSWORD`, and optionally `BOOTSTRAP_ADMIN_NAME` and
   `BOOTSTRAP_ADMIN_PHONE` (`+989xxxxxxxxx`). In the deployed Compose directory,
   run `docker compose --profile tools run --rm bootstrap`. The password must
   have at least 12 characters, upper/lowercase letters, a number and a symbol,
   with at most 72 UTF-8 bytes. Remove bootstrap variables afterward.
6. Sign in at `/admin/login`. Create other staff from `/admin/staff`. For SMS
   login, associate each staff member with a unique normalized phone number,
   configure provider/template in `/admin/settings`, and set its server-side
   `KAVENEGAR_API_KEY`, `SMS_IR_API_KEY`, or `IPPANEL_API_KEY`/`IPPANEL_SENDER`.
   No Supabase Auth hook is needed. Do not switch to SMS-only until delivery is
   verified with the actual provider.

The web process runs as UID 1001, with a named volume at `/app/data/uploads`.
The database uses its own named volume. Keep the same Compose project/service
identity across redeployments so Dokploy retains these volumes. Both are needed
for a complete backup. Use a single web replica on one host with this local
upload backend; multiple hosts need shared storage and cache coordination.

The standard service has no published host port. For local container testing,
use a Compose override publishing `127.0.0.1:3000:3000` for `web`. Production
cookies require HTTPS, including for local testing of the production image.

## Import an existing Supabase installation

This is a maintenance-window cutover into a **separate PostgreSQL database**.
Never run the new baseline on the existing Supabase database. Back up the source
and target first. Stop source writes during the final import, and keep the old
site available for rollback until the new site is verified.

The repository has an importer with a read-only source connection and an
explicit target-replacement flag. It preserves public records, IDs, timestamps,
foreign keys, staff profile roles/active status, and bcrypt password hashes.
It copies the five application Storage buckets and rewrites stored public
Storage URLs to `/api/files/`. Existing sessions are intentionally not imported;
users sign in again with their existing password or SMS. The source database
must contain the application's current tables; a schema mismatch fails instead
of silently discarding columns.

1. Run the new PostgreSQL baseline using `pnpm db:migrate` against the empty
   target. Do not bootstrap a new account when importing existing accounts.
2. On a trusted migration machine with access to both databases, install with
   `pnpm install --frozen-lockfile`. Set these environment variables securely:

   ```dotenv
   SOURCE_DATABASE_URL=postgresql://SOURCE_READ_USER:ENCODED_PASSWORD@SOURCE_HOST:5432/postgres
   DATABASE_ADMIN_URL=postgresql://postgres:ENCODED_PASSWORD@TARGET_HOST:5432/diyar
   SOURCE_STORAGE_URL=https://your-existing-supabase-host
   SOURCE_STORAGE_SECRET_KEY=YOUR_SERVER_SIDE_STORAGE_KEY
   UPLOAD_DIR=/absolute/path/to/new-imported-uploads
   ```

   The source DB account needs read access to the application `public` tables,
   `auth.users`, and `storage.objects`. The Storage secret needs read access to
   private objects. These credentials are only used by the import process and
   must never be placed in the web service.
3. Run `pnpm db:import` for a read-only inventory and schema check.
4. Stop writes on both deployments. Run
   `pnpm db:import --apply --replace-target` only against the backed-up replacement
   database. This replaces its content, users, and sessions. `UPLOAD_DIR` must
   not exist; the importer stages downloads before replacing target records.
5. Copy the **contents** of the imported upload directory into the Dokploy
   `uploads` volume, preserving bucket directories, and set ownership to UID/GID
   1001. Stop `web` during the copy. Do not mount an empty volume over the import.
6. Remove source/import/bootstrap credentials, start the target, and verify
   Persian and English pages, staff roles, product editing, all four public
   submission forms, public media and videos, and private document access.
   Compare source/target row counts and file counts before moving traffic.

File URLs outside the source Storage host (third-party media) remain unchanged.
If the source used a separate media CDN URL, normalize those URLs to the source
Storage URL before import or review/update them afterward. The optional
`LEGACY_MEDIA_URL` build setting permits Next image optimization for an old
Storage host during a staged transition; the standard cutover copies files.

## Schema changes and deployment operations

- `pnpm db:generate` compares `lib/db/schema.ts` with the committed snapshot.
  Review all emitted SQL. Drizzle does not manage the baseline's custom
  functions, role grants, or timestamp triggers; maintain those in SQL.
- `pnpm db:migrate` uses `DATABASE_ADMIN_URL`, takes a PostgreSQL advisory lock,
  and records applied migrations in the Drizzle journal. Repeated runs are safe.
  `DATABASE_APP_PASSWORD` sets or rotates the `diyar_app` login password.
- Runtime `DATABASE_URL` must connect as `diyar_app` (NOINHERIT, no ownership,
  no BYPASSRLS). Repository transactions choose `app_visitor` or `app_staff` and
  set the verified staff ID transaction-locally. Trusted credential/submission
  code uses `app_backend`; this role is never exposed to browsers.
- Sessions are hashed opaque tokens, expire after eight hours, and are revoked
  on logout. Active state and roles are checked from PostgreSQL on each request.
- Production domain changes require updating `APP_URL`. Existing SEO content
  can be edited in `/admin/seo`; the site's original canonical domain defaults
  are preserved in this refactor.
- Set request body limits at the reverse proxy to accommodate the existing
  15 MiB admin media and 10 MiB submission limits. Video requests support ranges.

## Backups and rollback

Back up PostgreSQL with `pg_dump` and the uploads volume together. Test restores
into an isolated environment. Never use `docker compose down -v` for redeploys.
For a failed initial cutover, restore routing to the unchanged Supabase service
and its original `main` branch. New submissions received by the PostgreSQL
service after cutover must be reconciled before reverting traffic. For later
schema changes, keep a database backup and use a reviewed forward fix or restore;
changing only the image cannot undo database migrations.
