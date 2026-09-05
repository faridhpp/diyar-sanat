import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { mkdtemp,readFile,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Client } from 'pg';
import { hashPassword,verifyPassword } from '../lib/auth/password';
const sourceUrl=process.env.IMPORT_SOURCE_DATABASE_URL,targetUrl=process.env.IMPORT_TARGET_DATABASE_URL;
const importTest=sourceUrl&&targetUrl?test:test.skip;
importTest('existing-data cutover preserves IDs, passwords, content, file bytes and rewrites URLs',async()=>{
  assert.ok(new URL(sourceUrl!).pathname.endsWith('_test'));assert.ok(new URL(targetUrl!).pathname.endsWith('_test'));
  const source=new Client({connectionString:sourceUrl}),target=new Client({connectionString:targetUrl});
  const temporary=await mkdtemp(join(tmpdir(),'diyar-import-')),destination=join(temporary,'uploads');
  const file='%PDF-1.4 imported';
  const server=createServer((request,response)=>{
    if(request.headers.authorization!=='Bearer test-secret'){response.writeHead(403);response.end();return;}
    response.writeHead(200,{'Content-Type':'application/pdf'});response.end(file);
  });
  try {
    await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
    const address=server.address();assert.ok(address&&typeof address==='object');const url=`http://127.0.0.1:${address.port}`;
    await source.connect();await target.connect();
    await source.query('create schema if not exists auth; create schema if not exists storage; create table if not exists auth.users(id uuid,email text,encrypted_password text,created_at timestamptz); create table if not exists storage.objects(bucket_id text,name text,metadata jsonb)');
    const password='Imported-Password-123',hash=await hashPassword(password),id='59cf1dac-a79f-4994-a448-72f6496c1a18';
    await source.query('insert into private.users(id,email,password_hash) values($1,$2,$3) on conflict(id) do nothing',[id,'import@example.test',hash]);
    await source.query("insert into profiles(id,role,is_active) values($1,'manager',true) on conflict(id) do nothing",[id]);
    await source.query('truncate auth.users,storage.objects');
    await source.query('insert into auth.users select id,email,password_hash,created_at from private.users');
    await source.query('insert into storage.objects values($1,$2,$3)',['site-media','test/import.pdf',JSON.stringify({size:Buffer.byteLength(file)})]);
    await source.query('update products set image_url=$1 where id=(select min(id) from products)',[url+'/storage/v1/object/public/site-media/test/import.pdf']);
    const run=(args:string[])=>new Promise<string>((resolve,reject)=>{
      const child=spawn(process.execPath,['--import','tsx','scripts/import-supabase.ts',...args],{cwd:process.cwd(),env:{...process.env,SOURCE_DATABASE_URL:sourceUrl,DATABASE_ADMIN_URL:targetUrl,SOURCE_STORAGE_URL:url,SOURCE_STORAGE_SECRET_KEY:'test-secret',UPLOAD_DIR:destination}});
      let output='';child.stdout.on('data',data=>{output+=data});child.stderr.on('data',data=>{output+=data});child.on('error',reject);child.on('exit',code=>code===0?resolve(output):reject(new Error(output)));
    });
    assert.ok((await run([])).includes('Dry run only'));
    assert.ok((await run(['--apply','--replace-target'])).includes('Imported records'));
    const user=(await target.query('select id,password_hash from private.users where id=$1',[id])).rows[0];assert.equal(user.id,id);assert.ok(await verifyPassword(password,user.password_hash));
    const srcCount=(await source.query('select count(*) from cities')).rows[0].count;
    assert.equal((await target.query('select count(*) from cities')).rows[0].count,srcCount);
    assert.equal((await target.query('select image_url from products order by id limit 1')).rows[0].image_url,'/api/files/site-media/test/import.pdf');
    assert.equal(await readFile(join(destination,'site-media/test/import.pdf'),'utf8'),file);
    assert.equal((await target.query('select count(*) from private.sessions')).rows[0].count,'0');
    assert.equal((await source.query('select image_url from products order by id limit 1')).rows[0].image_url,url+'/storage/v1/object/public/site-media/test/import.pdf');
  }finally {await Promise.all([source.end(),target.end()]);server.close();await rm(temporary,{recursive:true,force:true});}
});
