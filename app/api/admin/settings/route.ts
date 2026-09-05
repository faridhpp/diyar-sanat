import { getStaffUser } from '@/lib/admin/auth';
import { createClient } from '@/lib/db/server';
import { sameOrigin } from '@/lib/auth/security';
export async function POST(request:Request) {
  if(!sameOrigin(request))return new Response(null,{status:403});
  const staff=await getStaffUser();
  if(staff?.profile.role!=='manager')return new Response(null,{status:403});
  let value;try{value=await request.json();}catch{return new Response(null,{status:400});}
  const {login_method,sms_provider,sms_sender,sms_template_key,otp_ttl_seconds,otp_resend_seconds,require_captcha}=value;
  if(!['password','sms','both'].includes(login_method)||!(sms_provider===null||['kavenegar','sms_ir','ippanel'].includes(sms_provider))||typeof require_captcha!=='boolean'||!Number.isInteger(otp_ttl_seconds)||otp_ttl_seconds<60||otp_ttl_seconds>600||!Number.isInteger(otp_resend_seconds)||otp_resend_seconds<30||otp_resend_seconds>300||![sms_sender,sms_template_key].every(v=>v===null||(typeof v==='string'&&v.length<=200)))return new Response(null,{status:400});
  const {error}=await(await createClient()).from('admin_settings').update({login_method,sms_provider,sms_sender,sms_template_key,otp_ttl_seconds,otp_resend_seconds,require_captcha,updated_by:staff.user.id}).eq('id',true);
  return Response.json({ok:!error},{status:error?400:200});
}
