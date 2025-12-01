import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AchievementsService } from './achievements.service';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('achievements')
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class AchievementsController {
  constructor(private readonly achievementsService: AchievementsService) {}

  @Get()
  @Roles('CHILD', 'PARENT', 'TEACHER', 'ADMIN')
  list() {
    return this.achievementsService.listAll();
  }

  @Get('children/:childId')
  @Roles('CHILD', 'PARENT', 'TEACHER', 'ADMIN')
  listChild(@Param('childId') childId: string) {
    return this.achievementsService.listForChild(childId);
  }

  @Get('children/:childId/points')
  @Roles('CHILD', 'PARENT', 'TEACHER', 'ADMIN')
  async getChildPoints(@Param('childId') childId: string) {
    const points = await this.achievementsService.getChildPoints(childId);
    return { total_points: points };
  }

  @Post('children/:childId/:code')
  @Roles('TEACHER', 'ADMIN')
  award(@Param('childId') childId: string, @Param('code') code: string) {
    return this.achievementsService.awardByCode(childId, code.toUpperCase());
  }
}
