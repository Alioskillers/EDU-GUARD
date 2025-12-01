import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateGameDto {
  @IsString()
  title: string;

  @IsString()
  slug: string;

  @IsString()
  description: string;

  @IsEnum(['PHYSICS', 'CHEMISTRY', 'MATH', 'LANGUAGE', 'CODING', 'OTHER'], {
    message: 'subject must be a supported subject',
  })
  subject: string;

  @IsEnum(['3_5', '6_8', '9_12'])
  min_age_group: string;

  @IsEnum(['3_5', '6_8', '9_12'])
  max_age_group: string;

  @IsInt()
  @Min(1)
  estimated_duration_minutes: number;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
