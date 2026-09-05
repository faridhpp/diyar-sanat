import { randomInt } from 'node:crypto';
import { sql } from 'drizzle-orm';
import { backend } from '@/lib/db/connection';
import { repository } from '@/lib/db/query';
import { endSession, getSessionUser, startSession } from '@/lib/auth/session';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { sameOrigin, takeRateLimit } from '@/lib/auth/security';
import { sendOtp } from '@/lib/sms/providers';

const denied=()=>Response.json({error:'اطلاعات ورود یا کد واردشده معتبر نیست.'},{status:401});
async function audit(event:string,userId:string|null,identifier:string) {
  await backend(db=>db.execute(sql`insert into public.staff_login_events(user_id,identifier_hint,event_type) values(${userId},${identifier.slice(0,3)+'***'},${event})`));
}
export async function POST(request:Request,{params}:{params:Promise<{action:string}>}) {
  if(!sameOrigin(request))return Response.json({error:'Invalid origin'},{status:403});
  const {action}=await params;
  if(!['password','otp-request','otp-verify','logout'].includes(action))return new Response(null,{status:404});
  try {
    if(action==='logout') {
      const user=await getSessionUser();await endSession();
      if(user)await audit('signed_out',user.id,user.email);
      return Response.json({ok:true});
    }
    const body=await request.json();
    const {data:settings}=await repository({role:'app_visitor'}).from('admin_settings').select('*').eq('id',true).single();
    if(!settings)return Response.json({error:'ورود در دسترس نیست.'},{status:503});
    if(settings.require_captcha&&body.captcha!=='7')return denied();
    const identifier=String(action==='password'?body.email??'':body.phone??'').toLowerCase().trim();
    if(identifier.length>254||!identifier)return denied();
    // Database-backed throttles work across processes and survive restarts.
    if(!await takeRateLimit('auth:'+identifier,12,900))return Response.json({error:'تعداد تلاش‌ها زیاد است. بعداً دوباره تلاش کنید.'},{status:429});
    if(action==='password') {
      if(settings.login_method==='sms')return denied();
      const password=typeof body.password==='string'?body.password:'';
      if(Buffer.byteLength(password)>72)return denied();
      const user=await backend(async db=>(await db.execute<{id:string;password_hash:string}>(sql`select u.id,u.password_hash from private.users u join public.profiles p on p.id=u.id where u.email=${identifier} and p.is_active limit 1`)).rows[0]);
      // Constant-cost verification also covers unknown accounts.
      const valid=await verifyPassword(password,user?.password_hash??'$2b$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW');
      if(!user||!valid){await audit('password_failure',null,identifier);return denied();}
      await startSession(user.id);await audit('password_success',user.id,identifier);
      return Response.json({ok:true});
    }
    if(settings.login_method==='password'||!settings.sms_provider||!settings.sms_template_key||!/^\+989\d{9}$/.test(identifier))return denied();
    if(action==='otp-request') {
      const user=await backend(async db=>(await db.execute<{id:string}>(sql`select id from public.profiles where phone=${identifier} and is_active limit 1`)).rows[0]);
      // Never create an account from a login request.
      if(!user)return Response.json({ok:true});
      const code=String(randomInt(100000,1000000)),hash=await hashPassword(code);
      const reserved=await backend(async db=>(await db.execute(sql`insert into private.otp_challenges(phone,user_id,code_hash,expires_at,resend_at,attempts)
        values(${identifier},${user.id},${hash},now()+${settings.otp_ttl_seconds}*interval '1 second',now()+${settings.otp_resend_seconds}*interval '1 second',0)
        on conflict(phone) do update set code_hash=excluded.code_hash,expires_at=excluded.expires_at,resend_at=excluded.resend_at,attempts=0,user_id=excluded.user_id
        where otp_challenges.resend_at<=now() returning phone`)).rows.length>0);
      if(!reserved)return Response.json({error:'برای ارسال مجدد کمی صبر کنید.'},{status:429});
      try {await sendOtp({provider:settings.sms_provider,phone:identifier,code,template:settings.sms_template_key,sender:settings.sms_sender});}
      catch {await backend(db=>db.execute(sql`delete from private.otp_challenges where phone=${identifier} and code_hash=${hash}`));throw new Error('SMS unavailable');}
      await audit('otp_requested',user.id,identifier);return Response.json({ok:true});
    }
    if(!/^\d{6}$/.test(String(body.token??'')))return denied();
    const userId=await backend(async db=>{
      const challenge=(await db.execute<{user_id:string;code_hash:string;attempts:number}>(sql`select c.user_id,c.code_hash,c.attempts from private.otp_challenges c join public.profiles p on p.id=c.user_id where c.phone=${identifier} and c.expires_at>now() and c.attempts<5 and p.is_active for update of c`)).rows[0];
      if(!challenge)return null;
      await db.execute(sql`update private.otp_challenges set attempts=attempts+1 where phone=${identifier}`);
      if(!await verifyPassword(body.token,challenge.code_hash))return null;
      await db.execute(sql`delete from private.otp_challenges where phone=${identifier}`);
      return challenge.user_id;
    });
    if(!userId){await audit('otp_failure',null,identifier);return denied();}
    await startSession(userId);await audit('otp_success',userId,identifier);return Response.json({ok:true});
  } catch {return Response.json({error:'سرویس ورود در دسترس نیست. دوباره تلاش کنید.'},{status:503});}
}
