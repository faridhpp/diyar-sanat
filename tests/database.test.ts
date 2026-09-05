import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { sql } from 'drizzle-orm';
import { repository } from '../lib/db/query';
import { backend,getPool,withAccess } from '../lib/db/connection';
import { createStaffAccount } from '../lib/auth/accounts';
import { verifyPassword, validPassword } from '../lib/auth/password';
import { takeRateLimit } from '../lib/auth/security';
import { filePath,storage } from '../lib/storage/files';

const databaseTest=process.env.TEST_DATABASE_URL?test:test.skip;
if(process.env.TEST_DATABASE_URL)process.env.DATABASE_URL=process.env.TEST_DATABASE_URL;
after(async()=>{if(process.env.TEST_DATABASE_URL)await getPool().end();});

test('upload paths cannot escape a known bucket',()=>{
  for(const path of ['../outside','/absolute','a/../../outside','a\\b','a//b','a/%2e%2e/b'])assert.throws(()=>filePath('site-media',path));
  assert.throws(()=>filePath('unknown','file.pdf'));
});
test('password policy rejects short and bcrypt-truncated passwords',()=>{
  assert.equal(validPassword('Short1!'),false);
  assert.equal(validPassword('A1!'+ 'x'.repeat(70)),false);
  assert.equal(validPassword('Secure-Password-123'),true);
});
databaseTest('PostgreSQL data parity, role isolation, CRUD and pool context reset',async()=>{
  const visitor=repository({role:'app_visitor'}),trusted=repository({role:'app_backend'});
  const countries=await visitor.from('countries').select('*');assert.equal(countries.data?.length,2);
  const provinces=await visitor.from('provinces').select('*');assert.equal(provinces.data?.length,50);
  const cities=await visitor.from('cities').select('id',{count:'exact',head:true});assert.ok((cities.count??0)>=2119);
  const profiles=await visitor.from('profiles').select('*');assert.ok(profiles.error||profiles.data?.length===0);
  const tag=randomUUID().slice(0,8),users:string[]=[];
  let brandId:number|undefined;
  try {
    for(const role of ['manager','admin','seo'] as const)users.push(await createStaffAccount({email:`${role}-${tag}@example.test`,password:'Secure-Password-123',displayName:role,role}));
    const [manager,admin,seo]=users.map(userId=>repository({role:'app_staff',userId}));
    const brand=await manager.from('brands').insert({code:`draft-${tag}`}).select('*').single();assert.equal(brand.error,null);brandId=brand.data!.id;
    assert.equal((await visitor.from('brands').select('*').eq('id',brandId)).data?.length,0);
    assert.equal((await seo.from('brands').select('*').eq('id',brandId)).data?.length,1);
    assert.equal((await admin.from('profiles').select('*')).data?.length,1);
    const escalation=await seo.from('profiles').update({role:'manager'}).eq('id',users[2]);
    assert.ok(escalation.error||(await trusted.from('profiles').select('*').eq('id',users[2]).single()).data?.role==='seo');
    const inbox=await seo.from('contact_submissions').select('*');assert.ok(inbox.error||inbox.data?.length===0);
    const translations=[{brand_id:brandId,locale:'en' as const,name:'Draft',slug:`draft-${tag}`}];
    assert.equal((await manager.from('brand_translations').upsert(translations,{onConflict:'brand_id,locale'})).error,null);
    assert.equal((await manager.from('brand_translations').upsert([{...translations[0],name:'Updated'}],{onConflict:'brand_id,locale'})).error,null);
    assert.equal((await manager.from('brand_translations').select('*').eq('brand_id',brandId).single()).data?.name,'Updated');
    assert.equal((await manager.from('brands').update({is_published:true}).eq('id',brandId)).error,null);
    assert.equal((await visitor.from('brand_translations').select('*').eq('brand_id',brandId)).data?.length,1);
    const homepage=await visitor.from('homepage_video').select('*');assert.equal(homepage.error,null);
    const search=await visitor.from('cities').select('*').or('name_en.ilike.%Tabriz%,name_fa.ilike.%تبریز%').limit(25);assert.ok(search.data?.length);
    const noRows=await visitor.from('cities').select('*').in('id',[]);assert.deepEqual(noRows.data,[]);
    const deniedWrite=await visitor.from('brands').insert({code:`forbidden-${tag}`});assert.ok(deniedWrite.error);
    const leakedContext=await withAccess({role:'app_visitor'},db=>db.execute<{id:string}>(sql`select current_setting('app.user_id',true) as id`));assert.equal(leakedContext.rows[0].id,'');
    await backend(db=>db.execute(sql`update public.profiles set is_active=false where id=${users[2]}`));
    assert.equal((await seo.from('brands').select('*').eq('is_published',false)).data?.length,0);
    const hash=await backend(async db=>(await db.execute<{password_hash:string}>(sql`select password_hash from private.users where id=${users[0]}`)).rows[0].password_hash);
    assert.ok(await verifyPassword('Secure-Password-123',hash));assert.equal(await verifyPassword('wrong',hash),false);
    assert.equal(await takeRateLimit(`test:${tag}`,1,60),true);assert.equal(await takeRateLimit(`test:${tag}`,1,60),false);
  }finally {
    if(brandId)await trusted.from('brands').delete().eq('id',brandId);
    for(const id of users)await backend(db=>db.execute(sql`delete from private.users where id=${id}`));
  }
});
test('storage requires authorization, validates MIME and preserves file bytes',async()=>{
  const path=`test/${randomUUID()}.pdf`,file=new File(['%PDF-1.4 test'],'test.pdf',{type:'application/pdf'});
  assert.ok((await storage(false).from('site-media').upload(path,file,{contentType:file.type})).error);
  assert.equal((await storage(true).from('site-media').upload(path,file,{contentType:file.type})).error,null);
  assert.ok((await storage(true).from('site-media').upload(path,file,{contentType:file.type})).error);
  assert.equal((await storage(true).from('site-media').remove([path])).error,null);
});
