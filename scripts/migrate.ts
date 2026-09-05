import { loadEnvConfig } from '@next/env';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

loadEnvConfig(process.cwd());
async function main() {
  if (!process.env.DATABASE_ADMIN_URL) throw new Error('DATABASE_ADMIN_URL is required for migrations');
  const pool = new Pool({ connectionString: process.env.DATABASE_ADMIN_URL, max: 1 });
  const client = await pool.connect();
  try {
    await client.query('select pg_advisory_lock(84902163)');
    await migrate(drizzle(client), { migrationsFolder: './drizzle' });
    // Set the application login independently of migrations, allowing rotation.
    if (process.env.DATABASE_APP_PASSWORD) {
      const password = process.env.DATABASE_APP_PASSWORD;
      if (password.length < 16) throw new Error('DATABASE_APP_PASSWORD must contain at least 16 characters');
      const { rows } = await client.query('select quote_literal($1) as password', [password]);
      await client.query(`alter role diyar_app password ${rows[0].password}`);
    }
    console.log('Database migrations complete');
  } finally {
    await client.query('select pg_advisory_unlock(84902163)');
    client.release();
    await pool.end();
  }
}
main().catch(() => { console.error('Migration failed. Check database connectivity and migration SQL.'); process.exitCode = 1; });
