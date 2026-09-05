import { sql } from 'drizzle-orm';
import { backend } from '../db/connection';
import { hashPassword, validPassword } from './password';
export async function createStaffAccount(input: {email:string; password:string; displayName:string; role:'manager'|'admin'|'seo'; phone?:string}) {
  if (!validPassword(input.password) || !/^\S+@\S+\.\S+$/.test(input.email)) throw new Error('Invalid credentials');
  const hash = await hashPassword(input.password);
  return backend(async db => {
    const result = await db.execute<{id:string}>(sql`insert into private.users(email,password_hash) values (${input.email.toLowerCase().trim()},${hash}) returning id`);
    const id = result.rows[0].id;
    await db.execute(sql`insert into public.profiles(id,display_name,role,is_active,phone) values (${id},${input.displayName},${input.role},true,${input.phone?.trim() || null})`);
    return id;
  });
}
