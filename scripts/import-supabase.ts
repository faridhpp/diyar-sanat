/** One-time, explicit import into a replacement database. Source is READ ONLY. */
import { loadEnvConfig } from '@next/env';
import { Client } from 'pg';
import { mkdir,rename,rm,stat } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { dirname,resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { buckets,filePath } from '../lib/storage/files';
loadEnvConfig(process.cwd());
const ident=(name:string)=>'"'+name.replaceAll('"','""')+'"';
const apply=process.argv.includes('--apply');
const required=(name:string)=>{const value=process.env[name];if(!value)throw new Error(`Missing ${name}`);return value;};
async function main() {
  const sourceUrl=required('SOURCE_DATABASE_URL'),targetUrl=required('DATABASE_ADMIN_URL');
  if(sourceUrl===targetUrl)throw new Error('Source and target must differ');
  if(apply&&!process.argv.includes('--replace-target'))throw new Error('--apply requires --replace-target; back up the target first');
  const source=new Client({connectionString:sourceUrl}),target=new Client({connectionString:targetUrl});
  const destination=resolve(process.env.UPLOAD_DIR||'./data/uploads'),staging=destination+'.import-'+randomUUID();
  let committed=false,moved=false,commitAttempted=false;
  try {
    await source.connect();await target.connect();
    const identitySql='select current_database() as db, inet_server_addr()::text as host, inet_server_port() as port';
    const sourceIdentity=(await source.query(identitySql)).rows[0],targetIdentity=(await target.query(identitySql)).rows[0];
    if(JSON.stringify(sourceIdentity)===JSON.stringify(targetIdentity))throw new Error('Source and target resolve to the same database');
    await source.query('begin isolation level repeatable read read only');
    const tables=(await target.query<{table_name:string}>("select table_name from information_schema.tables where table_schema='public' and table_type='BASE TABLE' order by table_name")).rows.map(row=>row.table_name);
    const rows=new Map<string,Record<string,unknown>[]>();
    for(const table of tables)rows.set(table,(await source.query(`select * from public.${ident(table)}`)).rows);
    const users=(await source.query('select id,email,encrypted_password,created_at from auth.users')).rows;
    const objects=(await source.query<{bucket_id:string;name:string;metadata:{size?:number}|null}>('select bucket_id,name,metadata from storage.objects where bucket_id = any($1)',[buckets])).rows;
    console.log(`Import plan: ${tables.length} tables, ${[...rows.values()].reduce((sum,r)=>sum+r.length,0)} content rows, ${users.length} accounts, ${objects.length} files.`);
    const columns=(await target.query<{table_name:string;column_name:string;udt_name:string}>("select table_name,column_name,udt_name from information_schema.columns where table_schema='public'")).rows;
    for(const [table,records] of rows)for(const record of records)for(const key of Object.keys(record))if(!columns.some(c=>c.table_name===table&&c.column_name===key))throw new Error(`Source column ${table}.${key} is missing in target`);
    const edges=(await target.query<{child:string;parent:string}>("select c.conrelid::regclass::text as child,c.confrelid::regclass::text as parent from pg_constraint c where c.contype='f' and c.connamespace='public'::regnamespace")).rows;
    const ordered:string[]=[];
    while(ordered.length<tables.length) {
      const next=tables.find(t=>!ordered.includes(t)&&edges.filter(e=>e.child.replace('public.','')===t).every(e=>{const p=e.parent.replace('public.','');return p===t||!tables.includes(p)||ordered.includes(p);}));
      if(!next)throw new Error('Unsupported cyclic table dependencies');ordered.push(next);
    }
    if(!apply){console.log('Dry run only. To import, stop writes and rerun with --apply --replace-target into a backed-up replacement database.');return;}
    // Refuse to overwrite uploaded files. Use an empty destination on cutover.
    if(await stat(destination).then(()=>true,()=>false))throw new Error('UPLOAD_DIR must not exist for import; choose a fresh directory');
    const sourceStorage=objects.length?required('SOURCE_STORAGE_URL').replace(/\/$/,''):process.env.SOURCE_STORAGE_URL?.replace(/\/$/,'');
    const secret=objects.length?required('SOURCE_STORAGE_SECRET_KEY'):'';
    await mkdir(staging,{recursive:true});
    for(const object of objects) {
      // Reuse the same traversal protection as the serving endpoint.
      filePath(object.bucket_id,object.name);
      const local=resolve(staging,object.bucket_id,object.name);
      const response=await fetch(`${sourceStorage}/storage/v1/object/authenticated/${object.bucket_id}/${object.name.split('/').map(encodeURIComponent).join('/')}`,{headers:{apikey:secret,Authorization:`Bearer ${secret}`},signal:AbortSignal.timeout(120_000)});
      if(!response.ok||!response.body)throw new Error(`File download failed (${response.status})`);
      await mkdir(dirname(local),{recursive:true});
      await pipeline(Readable.fromWeb(response.body as import('node:stream/web').ReadableStream),createWriteStream(local,{flags:'wx',mode:0o600}));
      if(object.metadata?.size!==undefined&&(await stat(local)).size!==Number(object.metadata.size))throw new Error('Downloaded file size does not match source');
    }
    const rewrite=(value:unknown):unknown=>{
      if(typeof value==='string'&&sourceStorage)return value.replaceAll(sourceStorage+'/storage/v1/object/public/','/api/files/');
      if(Array.isArray(value))return value.map(rewrite);
      if(value&&typeof value==='object'&&!(value instanceof Date))return Object.fromEntries(Object.entries(value).map(([key,v])=>[key,rewrite(v)]));
      return value;
    };
    await target.query('begin');
    await target.query('select pg_advisory_xact_lock(84902163)');
    await target.query(`truncate ${tables.map(t=>'public.'+ident(t)).join(',')},private.users,private.sessions,private.otp_challenges,private.rate_limits restart identity`);
    for(const user of users)await target.query('insert into private.users(id,email,password_hash,created_at) values($1,$2,$3,$4)',[user.id,user.email?.toLowerCase()||`${user.id}@staff.invalid`,user.encrypted_password||'disabled',user.created_at]);
    const navigation=rows.get('navigation_items')??[],sortedNavigation:Record<string,unknown>[]=[];
    while(sortedNavigation.length<navigation.length){
      const next=navigation.find(row=>!sortedNavigation.includes(row)&&(row.parent_id===null||sortedNavigation.some(parent=>parent.id===row.parent_id)));
      if(!next)throw new Error('Navigation contains a cyclic or missing parent');sortedNavigation.push(next);
    }
    rows.set('navigation_items',sortedNavigation);
    for(const table of ordered) {
      for(const record of rows.get(table)!) {
        const keys=Object.keys(record),values=keys.map(key=>{
          const value=rewrite(record[key]);
          const json=columns.find(c=>c.table_name===table&&c.column_name===key)?.udt_name==='jsonb';
          return json&&value!==null?JSON.stringify(value):value;
        });
        await target.query(`insert into public.${ident(table)} (${keys.map(ident).join(',')}) overriding system value values (${values.map((_,i)=>'$'+(i+1)).join(',')})`,values);
      }
      const sequence=(await target.query<{seq:string|null}>('select pg_get_serial_sequence($1,$2) as seq',['public.'+table,'id'])).rows[0]?.seq;
      if(sequence)await target.query(`select setval($1,coalesce((select max(id) from public.${ident(table)}),1),exists(select 1 from public.${ident(table)}))`,[sequence]);
    }
    await mkdir(dirname(destination),{recursive:true});await rename(staging,destination);moved=true;
    commitAttempted=true;await target.query('commit');committed=true;
    console.log('Imported records, bcrypt password hashes, and files. Existing sessions were invalidated; staff must sign in again.');
  }finally {
    if(!committed)await target.query('rollback').catch(()=>{});
    if(!commitAttempted&&moved)await rename(destination,staging).catch(()=>{});
    if(!commitAttempted)await rm(staging,{recursive:true,force:true});
    if(commitAttempted&&!committed)console.error('Commit outcome is uncertain. Imported files were retained; inspect target records before retrying.');
    await source.query('rollback').catch(()=>{});
    await Promise.all([source.end(),target.end()]);
  }
}
main().catch(error=>{console.error(error instanceof Error?error.message:'Import failed');process.exitCode=1;});
