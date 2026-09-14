import { loadEnvConfig } from '@next/env';
import { createStaffAccount } from '../lib/auth/accounts';
import { getPool } from '../lib/db/connection';
import { backend } from '../lib/db/connection';
import { sql } from 'drizzle-orm';
loadEnvConfig(process.cwd());
async function main() {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL;
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  if (!email || !password) { console.log('Bootstrap: BOOTSTRAP_ADMIN_EMAIL / BOOTSTRAP_ADMIN_PASSWORD not set, skipping.'); return; }
  const existing = await backend(async db => (await db.execute<{id:string}>(sql`select id from public.profiles where role = 'manager' and is_active limit 1`)).rows[0]);
  if (existing) { console.log('Bootstrap: an active manager already exists, skipping.'); return; }
  await createStaffAccount({email,password,displayName:process.env.BOOTSTRAP_ADMIN_NAME || 'مدیر',role:'manager',phone:process.env.BOOTSTRAP_ADMIN_PHONE || undefined});
  console.log('Bootstrap: manager account created for', email);
}
main().catch(() => {console.error('Bootstrap failed: check credentials, duplicate email/phone, and database configuration.');process.exitCode=1;}).finally(async()=>{if(process.env.DATABASE_URL)await getPool().end();});
