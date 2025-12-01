import { UserRole } from '../constants/roles';

export interface RequestUser {
  id: string;
  auth_user_id: string;
  email: string;
  full_name: string;
  role: UserRole;
  child_profile?: {
    id: string;
    display_name: string;
    age: number;
    age_group: string;
    avatar_url?: string | null;
  } | null;
}
