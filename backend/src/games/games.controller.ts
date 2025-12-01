import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { GamesService } from './games.service';
import { CreateGameDto } from './dto/create-game.dto';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthUser } from '../common/decorators/user.decorator';
import type { RequestUser } from '../common/interfaces/request-user.interface';

@Controller('games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Get()
  async list(
    @Query('subject') subject?: string,
    @Query('age_group') ageGroup?: string,
  ) {
    return this.gamesService.findAll({ subject, age_group: ageGroup });
  }

  @Get(':slug')
  async getBySlug(@Param('slug') slug: string) {
    return this.gamesService.findBySlug(slug);
  }

  @Post()
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('ADMIN', 'TEACHER')
  async create(@Body() dto: CreateGameDto, @AuthUser() user: RequestUser) {
    return this.gamesService.create(dto, user.id);
  }
}
