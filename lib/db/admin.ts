import 'server-only';
import { repository } from './query';
import { storage } from '../storage/files';
// Call only after authorization, or in a validated public submission endpoint.
export function createAdminClient() {return {...repository({role:'app_backend'}),storage:storage(true)};}
