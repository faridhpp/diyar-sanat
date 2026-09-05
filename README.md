# Diyar Sanat

Bilingual Persian/English Next.js site and staff administration, backed by
PostgreSQL 17 and Drizzle. Package manager: pnpm 10.32.1; runtime: Node.js 24.

## Development

```sh
pnpm install --frozen-lockfile
cp .env.example .env
# Fill in distinct database passwords and matching connection URLs.
docker compose up -d postgres
pnpm db:migrate
pnpm db:bootstrap
pnpm dev
```

Compose keeps PostgreSQL on its internal network. For local CLI access, add a
local Compose override mapping `127.0.0.1:5432:5432` to the postgres service, or
use an existing local PostgreSQL 17 instance. The bootstrap command uses the
`BOOTSTRAP_ADMIN_*` variables; remove them after the manager has been created.

```sh
pnpm typecheck
pnpm lint
pnpm test
# Include database integration tests against a disposable migrated database:
TEST_DATABASE_URL=postgresql://diyar_app:PASSWORD@localhost:5432/diyar_test pnpm test
pnpm build
```

Database schema: `lib/db/schema.ts`. Change it, run `pnpm db:generate`, review
SQL including grants and RLS, then run `pnpm db:migrate`. Functions, triggers,
and role grants remain explicit SQL in migrations. Never use the owner
connection for the web application.

[Dokploy deployment, existing-data import, backups, and rollback](docs/DEPLOYMENT.md).
[Product context](docs/PROJECT_CONTEXT.md). [Development history](docs/DEVELOPMENT_LOG.md).
