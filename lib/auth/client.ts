'use client';
export async function authRequest(action:'password'|'otp-request'|'otp-verify'|'logout',payload:Record<string,unknown>={}) {
  const response=await fetch('/api/auth/'+action,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
  const result=await response.json();
  if(!response.ok)throw new Error(result.error||'ورود انجام نشد.');
}
