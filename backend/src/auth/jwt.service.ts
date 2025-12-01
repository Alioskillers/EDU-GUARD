import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { SupabaseService } from '../supabase/supabase.service';
import { UsersService } from '../users/users.service';
import { RequestUser } from '../common/interfaces/request-user.interface';
import { UserRole, ROLE_VALUES } from '../common/constants/roles';

interface SupabaseJWTPayload {
  aud: string;
  exp: number;
  sub: string;
  email?: string;
  role?: string;
  user_metadata?: {
    role?: string;
    full_name?: string;
    age?: string | number;
    age_group?: string;
    parent_email?: string;
  };
  app_metadata?: {
    provider?: string;
  };
}

@Injectable()
export class SupabaseJwtService {
  private readonly jwtSecret: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly supabaseService: SupabaseService,
    private readonly usersService: UsersService,
  ) {
    // Get JWT secret from Supabase
    // You can get this from: Supabase Dashboard → Settings → API → JWT Settings → JWT Secret
    // Trim whitespace in case it was copied with extra spaces
    const rawSecret = this.configService.get<string>('SUPABASE_JWT_SECRET') || '';
    this.jwtSecret = rawSecret.trim();
    
    if (!this.jwtSecret) {
      console.warn(
        'SUPABASE_JWT_SECRET not set. JWT validation will fall back to Supabase API.',
      );
    } else {
      console.log('JWT secret configured. Length:', this.jwtSecret.length);
    }
  }

  private validateRole(role: unknown): UserRole {
    if (typeof role === 'string' && ROLE_VALUES.includes(role as UserRole)) {
      return role as UserRole;
    }
    return 'CHILD'; // Default fallback
  }

  /**
   * Validates a JWT token and returns the user profile
   * First tries to validate the JWT directly, then falls back to Supabase API
   */
  async validateToken(accessToken: string): Promise<RequestUser> {
    // If we have JWT secret, validate the token directly
    if (this.jwtSecret) {
      try {
        // First, decode without verification to check token structure
        const decodedUnverified = jwt.decode(accessToken, { complete: true });
        if (!decodedUnverified || typeof decodedUnverified === 'string') {
          throw new Error('Invalid token structure');
        }

        // Verify JWT token with the secret
        // Supabase uses HS256 algorithm
        // Note: Supabase JWT secret is the raw secret, not base64 encoded
        const decoded = jwt.verify(accessToken, this.jwtSecret, {
          algorithms: ['HS256'],
          ignoreExpiration: false,
        }) as SupabaseJWTPayload;

        // Check if token is expired (additional check)
        if (decoded.exp && decoded.exp < Date.now() / 1000) {
          throw new UnauthorizedException('Token has expired');
        }

        // Get user profile from database
        const profile = await this.usersService.findByAuthUserId(decoded.sub);

        if (profile) {
          return profile;
        }

        // If profile doesn't exist, create it from JWT payload
        const metadataRole = decoded.user_metadata?.role || decoded.role;
        const validatedRole = this.validateRole(metadataRole);

        // Extract age and age_group from metadata for CHILD users
        const age = decoded.user_metadata?.age
          ? parseInt(String(decoded.user_metadata.age), 10)
          : undefined;
        const ageGroup = decoded.user_metadata?.age_group as string | undefined;

        const created = await this.usersService.createFromAuthPayload({
          auth_user_id: decoded.sub,
          email: decoded.email ?? '',
          full_name:
            decoded.user_metadata?.full_name ??
            decoded.email ??
            'New User',
          role: validatedRole,
          age,
          age_group: ageGroup,
        });

        return created;
      } catch (error) {
        // If JWT validation fails, fall back to Supabase API
        if (error instanceof UnauthorizedException) {
          throw error;
        }
        // Only log warning if JWT secret is set (means it's a real error)
        // If JWT secret is not set, silently fall back to API validation
        if (this.jwtSecret) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          // Don't log "invalid signature" repeatedly - it's expected if secret doesn't match
          if (!errorMessage.includes('invalid signature')) {
            console.warn('JWT validation failed, falling back to Supabase API:', errorMessage);
          }
        }
      }
    }

    // Fallback to Supabase API validation
    return this.validateViaSupabaseAPI(accessToken);
  }

  /**
   * Validates token using Supabase API (fallback method)
   * Note: When using service role key, we need to create a client with the anon key for user token validation
   */
  private async validateViaSupabaseAPI(accessToken: string): Promise<RequestUser> {
    // For user token validation, we need to use the anon key, not service role
    // Create a temporary client with anon key for token validation
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    // Try to get anon key from env (check both SUPABASE_ANON_KEY and NEXT_PUBLIC_SUPABASE_ANON_KEY)
    let supabaseAnonKey = 
      this.configService.get<string>('SUPABASE_ANON_KEY') ||
      this.configService.get<string>('NEXT_PUBLIC_SUPABASE_ANON_KEY');
    
    if (!supabaseUrl) {
      throw new UnauthorizedException('SUPABASE_URL not configured');
    }

    // Anon key is required for user token validation
    // Service role key cannot validate user tokens
    if (!supabaseAnonKey) {
      console.error('SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY not configured. Cannot validate user tokens.');
      throw new UnauthorizedException(
        'SUPABASE_ANON_KEY not configured. Please add it to your .env file (or use NEXT_PUBLIC_SUPABASE_ANON_KEY).',
      );
    }

    // Use anon key client for proper user token validation
    const { createClient } = await import('@supabase/supabase-js');
    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data, error } = await anonClient.auth.getUser(accessToken);

    if (error) {
      console.error('Supabase API validation error:', error.message);
      throw new UnauthorizedException(`Token validation failed: ${error.message}`);
    }

    if (!data.user) {
      console.error('Supabase API returned no user data');
      throw new UnauthorizedException('Invalid token: no user data');
    }

    const profile = await this.usersService.findByAuthUserId(data.user.id);

    if (profile) {
      return profile;
    }

    // Extract and validate role from user_metadata
    const metadataRole = data.user.user_metadata?.role;
    const validatedRole = this.validateRole(metadataRole);

        // Extract age and age_group from metadata for CHILD users
        const age = data.user.user_metadata?.age
          ? parseInt(String(data.user.user_metadata.age), 10)
          : undefined;
        const ageGroup = data.user.user_metadata?.age_group as string | undefined;

        const created = await this.usersService.createFromAuthPayload({
          auth_user_id: data.user.id,
          email: data.user.email ?? '',
          full_name:
            (data.user.user_metadata?.full_name as string) ??
            data.user.email ??
            'New User',
          role: validatedRole,
          age,
          age_group: ageGroup,
        });

    return created;
  }

  /**
   * Decodes a JWT token without verifying (for debugging)
   */
  decodeToken(token: string): SupabaseJWTPayload | null {
    try {
      return jwt.decode(token) as SupabaseJWTPayload;
    } catch {
      return null;
    }
  }

  /**
   * Verifies if the JWT secret is correctly configured
   * Returns true if secret is set and can decode a sample token structure
   */
  isJwtSecretConfigured(): boolean {
    return !!this.jwtSecret && this.jwtSecret.length > 0;
  }
}

