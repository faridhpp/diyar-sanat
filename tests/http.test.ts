import { test,after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { sql } from 'drizzle-orm';
import { backend,getPool } from '../lib/db/connection';
import { hashPassword } from '../lib/auth/password';
import { createStaffAccount } from '../lib/auth/accounts';
import { storage } from '../lib/storage/files';
const base=process.env.HTTP_TEST_URL;
const httpTest=base&&process.env.TEST_DATABASE_URL?test:test.skip;
if(process.env.TEST_DATABASE_URL)process.env.DATABASE_URL=process.env.TEST_DATABASE_URL;
after(async()=>{if(process.env.TEST_DATABASE_URL)await getPool().end();});
httpTest('production HTTP: locales, authentication, roles, uploads, submissions, logout',async()=>{
  const tag=randomUUID().slice(0,8),ids:string[]=[],uploaded:{bucket:string;path:string}[]=[],tracking:{table:string;code:string}[]=[];
  const post=(route:string,body:unknown,cookie='',origin=base!)=>fetch(base+route,{method:'POST',redirect:'manual',headers:{Origin:origin,'Content-Type':'application/json',Cookie:cookie},body:JSON.stringify(body)});
  try {
    for(const locale of ['fa','en']){
      const response=await fetch(`${base}/${locale}`);assert.equal(response.status,200);
      const html=await response.text();assert.ok(html.includes(`lang="${locale}"`));assert.ok(html.includes(`dir="${locale==='fa'?'rtl':'ltr'}"`));
      for(const route of ['/products','/careers','/representatives','/contact','/media','/faq'])assert.equal((await fetch(`${base}/${locale}${route}`)).status,200,`${locale}${route}`);
    }
    assert.equal((await fetch(base+'/api/health')).status,200);
    assert.equal((await fetch(base+'/admin',{redirect:'manual'})).status,307);
    for(const role of ['manager','seo'] as const)ids.push(await createStaffAccount({email:`http-${role}-${tag}@example.test`,password:'Secure-Password-123',displayName:'HTTP test',role,phone:role==='manager'?'+989'+String(Date.now()).slice(-9):undefined}));
    const login={email:`http-manager-${tag}@example.test`,password:'Secure-Password-123',captcha:'7'};
    assert.equal((await post('/api/auth/password',login,'','https://wrong.example')).status,403);
    assert.equal((await post('/api/auth/password',{...login,captcha:'0'})).status,401);
    assert.equal((await post('/api/auth/password',{...login,password:'wrong'})).status,401);
    const signed=await post('/api/auth/password',login);assert.equal(signed.status,200);
    const header=signed.headers.get('set-cookie')!;assert.ok(header.includes('HttpOnly'));assert.ok(header.includes('Secure'));assert.ok(header.includes('SameSite=lax'));
    const cookie=header.split(';')[0];
    for(const route of ['','/products','/brands','/product-categories','/locations','/representatives','/editorial','/certificates','/galleries','/media','/jobs','/job-applications','/contact-submissions','/international-inquiries','/representative-applications','/translations','/faqs','/seo','/site-settings','/staff','/settings','/menus'])assert.equal((await fetch(base+'/admin'+route,{headers:{Cookie:cookie}})).status,200,route);
    const uploadForm=new FormData();uploadForm.set('file',new File(['%PDF-1.4 HTTP test'],'test.pdf',{type:'application/pdf'}));uploadForm.set('folder','test');
    const uploadedResponse=await fetch(base+'/api/admin/uploads',{method:'POST',headers:{Cookie:cookie,Origin:base!},body:uploadForm});assert.equal(uploadedResponse.status,201);
    const asset=await uploadedResponse.json();uploaded.push({bucket:'site-media',path:asset.path});
    assert.ok(asset.url.startsWith('/api/files/site-media/'));
    const media=await fetch(base+asset.url);assert.equal(media.status,200);assert.equal(await media.text(),'%PDF-1.4 HTTP test');
    const ranged=await fetch(base+asset.url,{headers:{Range:'bytes=0-3'}});assert.equal(ranged.status,206);assert.equal(await ranged.text(),'%PDF');
    const seoResponse=await post('/api/auth/password',{...login,email:`http-seo-${tag}@example.test`});assert.equal(seoResponse.status,200);
    const seoCookie=seoResponse.headers.get('set-cookie')!.split(';')[0];
    assert.equal((await post('/api/admin/settings',{},seoCookie)).status,403);
    assert.equal((await fetch(base+'/api/admin/locations?level=countries',{headers:{Cookie:cookie}})).status,200);
    const forms=[
      {route:'contact-submissions',table:'contact_submissions',bucket:'contact-attachments',fileKey:'attachment',fields:{name:'Test User',mobile:'09121234567',email:'test@example.test',subject:'Integration test',destination:'sales',message:'Test message',captcha:'7',consent:'on'}},
      {route:'job-applications',table:'job_applications',bucket:'job-resumes',fileKey:'resume',fields:{name:'Test User',mobile:'09121234567',email:'test@example.test',expertise:'Engineering',position:'general',captcha:'7',consent:'on'}},
      {route:'international-inquiries',table:'international_inquiries',bucket:'international-profiles',fileKey:'profile',fields:{company:'Test Company',country:'Iraq',sector:'Distribution',experience:'Test experience',products:'Oil',cooperation_type:'distribution',captcha:'7',consent:'on'}},
      {route:'representative-applications',table:'representative_applications',bucket:'representative-documents',fileKey:'document',fields:{fullName:'Test User',identityCode:'12345',mobile:'09121234567',businessName:'Test business',businessType:'Distribution',facilities:'["warehouse"]',region:'Tabriz',city:'Tabriz',address:'Test address',experience:'Experience',distributionArea:'Tabriz',captcha:'7',consent:'true'}},
    ];
    for(const item of forms) {
      const form=new FormData();for(const [k,v] of Object.entries(item.fields))if(v!==undefined)form.set(k,v);
      form.set(item.fileKey,new File(['%PDF-1.4 private'],'private.pdf',{type:'application/pdf'}));
      const response=await fetch(base+'/api/'+item.route,{method:'POST',body:form});assert.equal(response.status,201,item.route);
      const payload=await response.json();assert.ok(payload.trackingCode);tracking.push({table:item.table,code:payload.trackingCode});
      const row=await backend(async db=>(await db.execute(sql`select * from ${sql.identifier(item.table)} where tracking_code=${payload.trackingCode}`)).rows[0]);
      const path=String(row.attachment_path??row.resume_url??row.company_profile_path??row.document_path);uploaded.push({bucket:item.bucket,path});
      const url=`${base}/api/files/${item.bucket}/${path}`;
      assert.equal((await fetch(url)).status,403);assert.equal((await fetch(url,{headers:{Cookie:seoCookie}})).status,403);
      const download=await fetch(url,{headers:{Cookie:cookie}});assert.equal(download.status,200);assert.equal(await download.text(),'%PDF-1.4 private');
    }
    // Exercise SMS verification without sending a real message/provider charge.
    const phone=await backend(async db=>(await db.execute<{phone:string}>(sql`select phone from profiles where id=${ids[0]}`)).rows[0].phone);
    await backend(db=>db.execute(sql`update admin_settings set login_method='both',sms_provider='kavenegar',sms_template_key='test' where id=true`));
    const otpHash=await hashPassword('123456');
    await backend(db=>db.execute(sql`insert into private.otp_challenges(phone,user_id,code_hash,expires_at,resend_at) values(${phone},${ids[0]},${otpHash},now()+interval '2 minutes',now()+interval '1 minute')`));
    assert.equal((await post('/api/auth/otp-verify',{phone,token:'000000',captcha:'7'})).status,401);
    const otpResults=await Promise.all([post('/api/auth/otp-verify',{phone,token:'123456',captcha:'7'}),post('/api/auth/otp-verify',{phone,token:'123456',captcha:'7'})]);
    assert.deepEqual(otpResults.map(r=>r.status).sort(),[200,401]);
    await backend(db=>db.execute(sql`update profiles set is_active=false where id=${ids[1]}`));
    assert.equal((await fetch(base+'/admin',{headers:{Cookie:seoCookie},redirect:'manual'})).status,307);
    assert.equal((await post('/api/auth/logout',{},cookie)).status,200);
    assert.equal((await fetch(base+'/admin',{headers:{Cookie:cookie},redirect:'manual'})).status,307);
  }finally {
    await backend(db=>db.execute(sql`update admin_settings set login_method='password',sms_provider=null,sms_template_key=null where id=true`));
    for(const item of uploaded)await storage(true).from(item.bucket).remove([item.path]);
    for(const row of tracking)await backend(db=>db.execute(sql`delete from ${sql.identifier(row.table)} where tracking_code=${row.code}`));
    for(const id of ids)await backend(db=>db.execute(sql`delete from private.users where id=${id}`));
  }
});
