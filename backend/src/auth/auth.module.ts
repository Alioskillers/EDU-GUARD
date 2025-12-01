import { Module, forwardRef } from '@nestjs/common';
import { SupabaseModule } from '../supabase/supabase.module';
import { AuthService } from './auth.service';
import { SupabaseJwtService } from './jwt.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [SupabaseModule, forwardRef(() => UsersModule)],
  providers: [AuthService, SupabaseJwtService],
  exports: [AuthService],
})
export class AuthModule {}
