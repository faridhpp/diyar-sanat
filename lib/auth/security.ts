import { createHash } from 'node:crypto';
import { sql } from 'drizzle-orm';
import { backend } from '../db/connection';
export function sameOrigin(request:Request) {
  const expected=process.env.APP_URL || (process.env.NODE_ENV!=='production'?new URL(request.url).origin:'');
  return Boolean(expected && request.headers.get('origin')===new URL(expected).origin);
}
export async function takeRateLimit(identifier:string,max=10,seconds=900) {
  const key=createHash('sha256').update(identifier).digest('hex');
  return backend(async db=>{
    await db.execute(sql`delete from private.rate_limits where resets_at<now()-interval '1 day'`);
    const result=await db.execute<{attempts:number}>(sql`insert into private.rate_limits(key,attempts,resets_at)
      values (${key},1,now()+${seconds}*interval '1 second') on conflict(key) do update set
      attempts=case when rate_limits.resets_at<=now() then 1 else rate_limits.attempts+1 end,
      resets_at=case when rate_limits.resets_at<=now() then now()+${seconds}*interval '1 second' else rate_limits.resets_at end
      returning attempts`);
    return result.rows[0].attempts<=max;
  });
}
