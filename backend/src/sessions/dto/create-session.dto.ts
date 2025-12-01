import { IsString } from 'class-validator';

export class CreateSessionDto {
  @IsString()
  child_id: string;

  @IsString()
  game_id: string;
}
