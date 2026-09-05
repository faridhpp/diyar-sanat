# Dokploy deployment and Supabase cutover

## Deploy with your existing Dokploy PostgreSQL

1. Create a Dokploy **Application**, select the `next` branch, and choose the
   **Dockerfile** build type with the root `Dockerfile` (context `.`).
2. Set the existing database connection in the application's runtime Environment:

   ```dotenv
   DATABASE_URL=postgresql://USERNAME:PASSWORD@DOKPLOY_POSTGRES_HOST:5432/DATABASE
   ```

   Copy the internal connection details from your existing Dokploy PostgreSQL
   service. URL-encode special characters in the password. The application must
   share a Dokploy network with that database. Use a dedicated database in your
   existing PostgreSQL service for this application's tables.
3. Set your domain to container port **3000** with HTTPS and deploy. The image
   applies pending Drizzle migrations automatically, then starts Next.js. No
   build-time database access, Compose service, separate migration container,
   second password, or manual migration command is required. If migrations fail,
   the web server does not start; check the deployment logs.
4. Add a persistent volume mount at **`/app/data/uploads`** in Dokploy to retain
   media and private attachments across redeploys. The container runs as UID/GID
   **1001**; a bind mount must be writable by that user.

`DATABASE_URL` is the only required environment variable. The supplied database
user must be able to apply the existing migrations (create schemas/tables/roles)
and assume `app_visitor`, `app_staff`, and `app_backend`. The database owner
credential provided by Dokploy is suitable. Application queries explicitly use
those restricted roles inside transactions, preserving database RLS.

Authentication checks the browser Origin against the request Host by default;
keep Dokploy/Traefik's forwarded public Host. Optionally set
`APP_URL=https://your-domain.com` to pin the permitted origin.

For a fresh installation, temporarily set `BOOTSTRAP_ADMIN_EMAIL` and
`BOOTSTRAP_ADMIN_PASSWORD`, then run **`node tools/bootstrap.cjs`** in the
application's Dokploy terminal. The optional name and phone variables are listed
in `.env.example`. Remove bootstrap variables afterward. Imported installations
retain their existing staff accounts and do not need a new manager.

For SMS login, configure a provider/template in `/admin/settings` and add the
corresponding API key from `.env.example`. Real SMS delivery requires working
provider credentials. Use a single application replica with this local upload
backend; multiple hosts require shared storage.

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
   1001. Stop the application during the copy. Do not mount an empty volume over the import.
6. Remove source/import/bootstrap credentials, start the application, and verify
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
- Startup and `pnpm db:migrate` use `DATABASE_URL`, take a PostgreSQL advisory
  lock, and record applied migrations in the Drizzle journal. Repeated runs are
  safe. CLI tools still accept `DATABASE_ADMIN_URL` as an optional override.
- Repository transactions select `app_visitor` or `app_staff` and set the
  verified user ID transaction-locally. Trusted credential/submission code uses
  `app_backend`. Credentials and these roles are never exposed to browsers.
- Sessions are hashed opaque tokens, expire after eight hours, and are revoked
  on logout. Active state and roles are checked from PostgreSQL on each request.
- If `APP_URL` is configured, update it when the domain changes. Existing SEO content
  can be edited in `/admin/seo`; the site's original canonical domain defaults
  are preserved in this refactor.
- Set request body limits at the reverse proxy to accommodate the existing
  15 MiB admin media and 10 MiB submission limits. Video requests support ranges.

## Backups and rollback

Back up PostgreSQL with `pg_dump` and the uploads volume together. Test restores
into an isolated environment. Retain the upload volume when redeploying or replacing the application.
For a failed initial cutover, restore routing to the unchanged Supabase service
and its original `main` branch. New submissions received by the PostgreSQL
service after cutover must be reconciled before reverting traffic. For later
schema changes, keep a database backup and use a reviewed forward fix or restore;
changing only the image cannot undo database migrations.
