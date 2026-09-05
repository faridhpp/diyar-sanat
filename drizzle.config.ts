import { loadEnvConfig } from '@next/env';
import { defineConfig } from 'drizzle-kit';
loadEnvConfig(process.cwd());
export default defineConfig({
  dialect: 'postgresql',
  schema: './lib/db/schema.ts',
  out: './drizzle',
  introspect: { casing: 'preserve' },
  schemaFilter: ['public', 'private'],
  dbCredentials: { url: process.env.DATABASE_ADMIN_URL || process.env.DATABASE_URL || '' },
});
