import 'server-only';
import { cookies } from 'next/headers';
import { cache } from 'react';
import { createHash, randomBytes } from 'node:crypto';
import { sql } from 'drizzle-orm';
import { backend } from '../db/connection';
import { hasDatabaseEnv } from '../db/env';
import type { StaffRole } from '../admin/modules';

export const sessionCookie = 'diyar_session';
export const tokenHash = (token:string) => createHash('sha256').update(token).digest('hex');
export type SessionUser = {id:string;email:string;display_name:string|null;role:StaffRole;phone:string|null;is_active:boolean;last_seen_at:string|null};
export const getSessionUser=cache(async():Promise<SessionUser|null>=>{
  const token=(await cookies()).get(sessionCookie)?.value;
  if(!token||!hasDatabaseEnv()||!/^[a-f0-9]{64}$/.test(token))return null;
  return backend(async db=>{
    const result=await db.execute<SessionUser>(sql`select u.id,u.email,p.display_name,p.role,p.phone,p.is_active,p.last_seen_at
      from private.sessions s join private.users u on u.id=s.user_id join public.profiles p on p.id=u.id
      where s.token_hash=${tokenHash(token)} and s.expires_at>now() and p.is_active limit 1`);
    return result.rows[0]??null;
  });
});
export async function startSession(userId:string) {
  const store=await cookies();
  const previous=store.get(sessionCookie)?.value;
  const token=randomBytes(32).toString('hex');
  const expires=new Date(Date.now()+8*60*60*1000);
  await backend(async db=>{
    if(previous)await db.execute(sql`delete from private.sessions where token_hash=${tokenHash(previous)}`);
    await db.execute(sql`delete from private.sessions where expires_at<=now()`);
    await db.execute(sql`insert into private.sessions(token_hash,user_id,expires_at) values(${tokenHash(token)},${userId},${expires.toISOString()})`);
    await db.execute(sql`update public.profiles set last_seen_at=now() where id=${userId}`);
  });
  store.set(sessionCookie,token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',expires});
}
export async function endSession() {
  const store=await cookies(),token=store.get(sessionCookie)?.value;
  if(token)await backend(db=>db.execute(sql`delete from private.sessions where token_hash=${tokenHash(token)}`));
  store.delete(sessionCookie);
}
