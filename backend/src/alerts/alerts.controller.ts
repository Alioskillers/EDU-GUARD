import { Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('alerts')
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get('children/:childId')
  @Roles('PARENT', 'TEACHER', 'ADMIN', 'CHILD')
  list(@Param('childId') childId: string) {
    return this.alertsService.listAlerts(childId);
  }

  @Patch(':id/resolve')
  @Roles('PARENT', 'TEACHER', 'ADMIN')
  resolve(@Param('id') id: string) {
    return this.alertsService.resolveAlert(id);
  }
}
