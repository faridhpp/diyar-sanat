import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { getSessionUser } from '../auth/session';
export const getStaffUser=cache(async()=>{
  const user=await getSessionUser();
  if(!user)return null;
  return {user:{id:user.id,email:user.email},profile:user};
});
export async function requireStaff(){const staff=await getStaffUser();if(!staff)redirect('/admin/login');return staff;}
