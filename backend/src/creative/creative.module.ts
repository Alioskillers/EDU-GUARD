import { Module, forwardRef } from '@nestjs/common';
import { CreativeController } from './creative.controller';
import { CreativeService } from './creative.service';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { ContentFilterService } from '../common/services/content-filter.service';
import { AlertsModule } from '../alerts/alerts.module';

@Module({
  imports: [DatabaseModule, forwardRef(() => AuthModule), AlertsModule],
  controllers: [CreativeController],
  providers: [CreativeService, ContentFilterService],
  exports: [CreativeService],
})
export class CreativeModule {}

