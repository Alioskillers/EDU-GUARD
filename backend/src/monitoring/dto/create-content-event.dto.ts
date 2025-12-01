import { IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateContentEventDto {
  @IsString()
  child_id: string;

  @IsEnum(['GAME', 'VIDEO', 'ARTICLE', 'CHAT'])
  content_type: string;

  @IsString()
  reference_id: string;

  @IsOptional()
  @IsString()
  raw_text?: string;

  @IsOptional()
  labels?: string[];
}
