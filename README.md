# Diyar Sanat

Bilingual Persian/English Next.js site and staff administration, backed by
PostgreSQL 17 and Drizzle. Package manager: pnpm 10.32.1; runtime: Node.js 24.

## Development

```sh
pnpm install --frozen-lockfile
cp .env.example .env
# Set DATABASE_URL to your existing PostgreSQL connection.
pnpm db:migrate
pnpm db:bootstrap
pnpm dev
```

The production Dockerfile runs migrations automatically before starting the app.
In Dokploy, choose **Application → Dockerfile**, set `DATABASE_URL` to your existing
PostgreSQL service, and route your domain to container port **3000**. Add a
persistent volume at `/app/data/uploads` to retain uploaded files on redeploys.

The bootstrap command uses `BOOTSTRAP_ADMIN_*`; remove these variables afterward.

```sh
pnpm typecheck
pnpm lint
pnpm test
# Include database integration tests against a disposable migrated database:
TEST_DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/diyar_test pnpm test
pnpm build
```

Database schema: `lib/db/schema.ts`. Change it, run `pnpm db:generate`, review
SQL including grants and RLS, then run `pnpm db:migrate`. Functions, triggers,
and role grants remain explicit SQL in migrations. Application queries always select the existing visitor/staff/backend roles
inside a transaction so RLS remains enforced with your supplied connection.

[Dokploy deployment, existing-data import, backups, and rollback](docs/DEPLOYMENT.md).
[Product context](docs/PROJECT_CONTEXT.md). [Development history](docs/DEVELOPMENT_LOG.md).
