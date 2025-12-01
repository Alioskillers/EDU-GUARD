import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthUser } from '../common/decorators/user.decorator';
import type { RequestUser } from '../common/interfaces/request-user.interface';
import { LinkChildByCodeDto } from './dto/link-child-by-code.dto';

@Controller()
@UseGuards(SupabaseAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@AuthUser() user: RequestUser) {
    const parentChildren =
      user.role === 'PARENT'
        ? await this.usersService.listChildrenForParent(user.id)
        : [];

    return {
      ...user,
      children: parentChildren,
    };
  }

      @Post('parent/children/link')
      @UseGuards(RolesGuard)
      @Roles('PARENT')
      async linkChildByCode(
        @Body() dto: LinkChildByCodeDto,
        @AuthUser() user: RequestUser,
      ) {
        return this.usersService.linkChildByGuardianCode(
          user.id,
          dto.guardian_code,
          dto.relationship,
        );
      }
}
