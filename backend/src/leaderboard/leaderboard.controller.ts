import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('leaderboard')
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get()
  @Roles('CHILD', 'PARENT', 'TEACHER', 'ADMIN')
  list(@Query('age_group') ageGroup?: string) {
    return this.leaderboardService.getLeaderboard(ageGroup);
  }
}
