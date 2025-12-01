import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { SupabaseModule } from './supabase/supabase.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { GamesModule } from './games/games.module';
import { SessionsModule } from './sessions/sessions.module';
import { AchievementsModule } from './achievements/achievements.module';
import { MonitoringModule } from './monitoring/monitoring.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { AlertsModule } from './alerts/alerts.module';
import { CreativeModule } from './creative/creative.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env'], // Look for .env in backend folder, then root folder
    }),
    DatabaseModule,
    SupabaseModule,
    AuthModule,
    UsersModule,
    GamesModule,
    SessionsModule,
    AchievementsModule,
    MonitoringModule,
    AlertsModule,
    LeaderboardModule,
    CreativeModule,
  ],
})
export class AppModule {}
