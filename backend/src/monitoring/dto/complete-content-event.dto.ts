import { IsOptional, IsString } from 'class-validator';

export class CompleteContentEventDto {
  @IsOptional()
  @IsString()
  raw_text?: string;
}
