import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { CompleteSessionDto } from './dto/complete-session.dto';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller()
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post('sessions')
  @Roles('CHILD', 'PARENT', 'TEACHER', 'ADMIN')
  create(@Body() dto: CreateSessionDto) {
    return this.sessionsService.createSession(dto);
  }

  @Patch('sessions/:id/complete')
  @Roles('CHILD', 'PARENT', 'TEACHER', 'ADMIN')
  complete(@Param('id') id: string, @Body() dto: CompleteSessionDto) {
    return this.sessionsService.completeSession(id, dto);
  }

  @Get('children/:childId/sessions')
  @Roles('PARENT', 'TEACHER', 'ADMIN', 'CHILD')
  list(@Param('childId') childId: string, @Query('limit') limit = '20') {
    return this.sessionsService.listSessionsForChild(childId, Number(limit));
  }
}
