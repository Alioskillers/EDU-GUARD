import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { MonitoringService } from './monitoring.service';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateContentEventDto } from './dto/create-content-event.dto';
import { CompleteContentEventDto } from './dto/complete-content-event.dto';

@Controller()
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class MonitoringController {
  constructor(private readonly monitoringService: MonitoringService) {}

  @Post('monitoring/events')
  @Roles('CHILD', 'PARENT', 'TEACHER', 'ADMIN')
  create(@Body() dto: CreateContentEventDto) {
    return this.monitoringService.createContentEvent(dto);
  }

  @Patch('monitoring/events/:id/complete')
  @Roles('CHILD', 'PARENT', 'TEACHER', 'ADMIN')
  complete(@Param('id') id: string, @Body() dto: CompleteContentEventDto) {
    return this.monitoringService.completeContentEvent(id, dto);
  }

  @Get('children/:childId/monitoring/summary')
  @Roles('PARENT', 'TEACHER', 'ADMIN', 'CHILD')
  summary(@Param('childId') childId: string) {
    return this.monitoringService.getSummary(childId);
  }
}
