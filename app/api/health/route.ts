import { sql } from 'drizzle-orm';
import { withAccess } from '@/lib/db/connection';
export async function GET() {
  try {await withAccess({role:'app_visitor'},db=>db.execute(sql`select id from public.admin_settings limit 1`));return Response.json({status:'ok'},{headers:{'Cache-Control':'no-store'}});}
  catch{return Response.json({status:'unavailable'},{status:503});}
}
