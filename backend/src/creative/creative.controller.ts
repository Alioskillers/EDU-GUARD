import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CreativeService } from './creative.service';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthUser } from '../common/decorators/user.decorator';
import { RequestUser } from '../common/interfaces/request-user.interface';
import { CreateCreationDto } from './dto/create-creation.dto';

@Controller('creative')
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class CreativeController {
  constructor(private readonly creativeService: CreativeService) {}

  @Post('creations')
  @Roles('CHILD')
  async create(@Body() dto: CreateCreationDto, @AuthUser() user: RequestUser) {
    // Ensure the child_id matches the authenticated user's child profile
    const childId = user.child_profile?.id;
    if (!childId || childId !== dto.child_id) {
      throw new Error('Unauthorized: child_id does not match authenticated user');
    }
    return this.creativeService.createCreation(dto);
  }

  @Get('creations')
  @Roles('CHILD')
  list(@AuthUser() user: RequestUser) {
    const childId = user.child_profile?.id;
    if (!childId) {
      throw new Error('No child profile found');
    }
    return this.creativeService.listCreations(childId);
  }
}

