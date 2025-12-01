import { UserRole } from '../../common/constants/roles';

export interface CreateUserFromAuthDto {
  auth_user_id: string;
  email: string;
  full_name: string;
  role: UserRole;
  age?: number;
  age_group?: string;
}
