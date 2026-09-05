import { loadEnvConfig } from '@next/env';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

loadEnvConfig(process.cwd());
async function main() {
  const connectionString = process.env.DATABASE_ADMIN_URL || process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is required');
  const pool = new Pool({ connectionString, max: 1, connectionTimeoutMillis: 15000 });
  const client = await pool.connect();
  try {
    await client.query('select pg_advisory_lock(84902163)');
    await migrate(drizzle(client), { migrationsFolder: './drizzle' });
    console.log('Database migrations complete');
  } finally {
    await client.query('select pg_advisory_unlock(84902163)');
    client.release();
    await pool.end();
  }
}
main().catch(() => { console.error('Migration failed. Check database connectivity and migration SQL.'); process.exitCode = 1; });
