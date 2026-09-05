import { mkdir, writeFile, unlink } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

export const fileTypes:Record<string,string>={jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp',avif:'image/avif',pdf:'application/pdf',mp4:'video/mp4',webm:'video/webm',doc:'application/msword',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'};
export const buckets=['site-media','job-resumes','contact-attachments','international-profiles','representative-documents'] as const;
export function filePath(bucket:string,path:string) {
  if(!(buckets as readonly string[]).includes(bucket)||!path||path.split('/').some(part=>!part||part==='.'||part==='..'||!/^[a-zA-Z0-9_.-]+$/.test(part)))throw new Error('Invalid file path');
  return resolve(process.env.UPLOAD_DIR||'./data/uploads',bucket,path);
}
export function fileUrl(bucket:string,path:string) {
  filePath(bucket,path);
  return `/api/files/${bucket}/${path.split('/').map(encodeURIComponent).join('/')}`;
}
export function storage(canWrite:boolean) {
  return {from:(bucket:string)=>({
    async upload(path:string,file:File,options:{contentType:string;upsert?:boolean;cacheControl?:string}) {
      try {
        if(!canWrite)throw new Error('Unauthorized upload');
        const extension=path.split('.').pop()||'';
        const limit=(bucket==='site-media'?15:10)*1024*1024;
        if(!file.size||file.size>limit||fileTypes[extension]!==options.contentType)throw new Error('Invalid file');
        const destination=filePath(bucket,path);
        await mkdir(dirname(destination),{recursive:true});
        await writeFile(destination,Buffer.from(await file.arrayBuffer()),{flag:options.upsert?'w':'wx',mode:0o600});
        return {error:null};
      } catch {return {error:{message:'Upload failed'}};}
    },
    async remove(paths:string[]) {
      try {if(!canWrite)throw new Error('Unauthorized deletion');await Promise.all(paths.map(path=>unlink(filePath(bucket,path))));return {error:null};}
      catch {return {error:{message:'File removal failed'}};}
    },
    getPublicUrl(path:string) {if(bucket!=='site-media')throw new Error('Private bucket');return {data:{publicUrl:fileUrl(bucket,path)}};},
  })};
}
