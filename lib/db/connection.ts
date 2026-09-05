import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool, types } from 'pg';
import { sql } from 'drizzle-orm';

// The existing presentation model uses numeric identity IDs and ISO timestamps.
types.setTypeParser(20, Number);
types.setTypeParser(1700, Number);
types.setTypeParser(1184, (value) => new Date(value).toISOString());
const globalDb = globalThis as unknown as { diyarPool?: Pool };
export function getPool() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  return globalDb.diyarPool ??= new Pool({
    connectionString: process.env.DATABASE_URL,
    max: Number(process.env.DATABASE_POOL_SIZE || 10),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    statement_timeout: 15_000,
  });
}
export type Access = { role: 'app_visitor' | 'app_staff' | 'app_backend'; userId?: string };
export async function withAccess<T>(access: Access, work: (db: NodePgDatabase<Record<string, never>>) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query('begin');
    const db = drizzle(client);
    await db.execute(sql`set local role ${sql.identifier(access.role)}`);
    await db.execute(sql`select set_config('app.user_id', ${access.userId ?? ''}, true)`);
    const result = await work(db);
    await client.query('commit');
    return result;
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally { client.release(); }
}
export const backend = <T>(work: (db: NodePgDatabase<Record<string, never>>) => Promise<T>) => withAccess({role:'app_backend'}, work);
