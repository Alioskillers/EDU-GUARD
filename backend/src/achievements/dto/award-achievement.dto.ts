import { IsString } from 'class-validator';

export class AwardAchievementDto {
  @IsString()
  child_id: string;

  @IsString()
  achievement_id: string;
}
