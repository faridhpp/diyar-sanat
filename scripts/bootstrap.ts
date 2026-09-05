import { loadEnvConfig } from '@next/env';
import { createStaffAccount } from '../lib/auth/accounts';
import { getPool } from '../lib/db/connection';
loadEnvConfig(process.cwd());
async function main() {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL;
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  if (!email || !password) throw new Error('Set BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD');
  await createStaffAccount({email,password,displayName:process.env.BOOTSTRAP_ADMIN_NAME || 'مدیر',role:'manager',phone:process.env.BOOTSTRAP_ADMIN_PHONE || undefined});
  console.log('Manager created. Remove the bootstrap environment variables.');
}
main().catch(() => {console.error('Bootstrap failed: check credentials, duplicate email/phone, and database configuration.');process.exitCode=1;}).finally(async()=>{if(process.env.DATABASE_URL)await getPool().end();});
