import { IsBoolean, IsInt, IsOptional, IsObject } from 'class-validator';

export class CompleteSessionDto {
  @IsOptional()
  @IsInt()
  score?: number;

  @IsBoolean()
  completed: boolean;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
