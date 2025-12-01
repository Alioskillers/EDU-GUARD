import { Injectable } from '@nestjs/common';
import { SupabaseJwtService } from './jwt.service';
import { RequestUser } from '../common/interfaces/request-user.interface';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: SupabaseJwtService) {}

  /**
   * Validates an access token using JWT validation
   * This now uses direct JWT validation instead of Supabase API calls
   */
  async validateAccessToken(accessToken: string): Promise<RequestUser> {
    return this.jwtService.validateToken(accessToken);
  }
}
