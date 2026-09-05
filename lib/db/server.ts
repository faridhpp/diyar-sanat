import 'server-only';
import { repository } from './query';
import { getSessionUser } from '../auth/session';
import { storage } from '../storage/files';
export async function createClient() {
  const user=await getSessionUser();
  return {...repository(user?{role:'app_staff',userId:user.id}:{role:'app_visitor'}),storage:storage(Boolean(user))};
}
