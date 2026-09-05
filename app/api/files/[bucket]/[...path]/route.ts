import { stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { Readable } from 'node:stream';
import { getSessionUser } from '@/lib/auth/session';
import { filePath,fileTypes } from '@/lib/storage/files';
export const runtime='nodejs';
export async function GET(request:Request,{params}:{params:Promise<{bucket:string;path:string[]}>}) {
  const {bucket,path}=await params;
  if(bucket!=='site-media') {
    const user=await getSessionUser();
    if(!user||!['manager','admin'].includes(user.role))return new Response(null,{status:403});
  }
  try {
    const filename=filePath(bucket,path.join('/')),info=await stat(filename);
    if(!info.isFile())return new Response(null,{status:404});
    const type=fileTypes[path.at(-1)?.split('.').pop()||'']||'application/octet-stream';
    let start=0,end=info.size-1,status=200;
    const range=request.headers.get('range');
    if(range){
      const match=/^bytes=(\d*)-(\d*)$/.exec(range);
      if(!match||(!match[1]&&!match[2]))return new Response(null,{status:416,headers:{'Content-Range':`bytes */${info.size}`}});
      if(!match[1])start=Math.max(0,info.size-Number(match[2]));
      else {start=Number(match[1]);if(match[2])end=Math.min(end,Number(match[2]));}
      if(start>end||start>=info.size)return new Response(null,{status:416,headers:{'Content-Range':`bytes */${info.size}`}});
      status=206;
    }
    const headers:Record<string,string>={
      'Content-Type':type,'Content-Length':String(end-start+1),'Accept-Ranges':'bytes',
      'X-Content-Type-Options':'nosniff',
      'Content-Security-Policy':"default-src 'none'; sandbox",
      'Cache-Control':bucket==='site-media'?'public, max-age=31536000, immutable':'private, no-store',
      'Content-Disposition':`${bucket==='site-media'?'inline':'attachment'}; filename="${path.at(-1)}"`,
    };
    if(status===206)headers['Content-Range']=`bytes ${start}-${end}/${info.size}`;
    return new Response(Readable.toWeb(createReadStream(filename,{start,end})) as ReadableStream,{status,headers});
  }catch{return new Response(null,{status:404});}
}
