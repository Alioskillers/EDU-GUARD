import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../../auth/auth.service';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader: string | undefined = request.headers['authorization'];

    if (!authHeader) {
      console.warn('Missing Authorization header for request:', request.url);
      throw new UnauthorizedException('Missing Authorization header');
    }

    const token = authHeader.replace(/Bearer/i, '').trim();

    if (!token) {
      console.warn('Invalid Authorization header format for request:', request.url);
      throw new UnauthorizedException('Invalid Authorization header');
    }

    try {
      const user = await this.authService.validateAccessToken(token.trim());
      request.user = user;
      return true;
    } catch (error) {
      console.error('Token validation failed:', error);
      throw error;
    }
  }
}
