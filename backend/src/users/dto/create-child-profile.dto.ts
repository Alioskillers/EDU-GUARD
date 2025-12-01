import { IsEmail, IsEnum, IsInt, IsString, Max, Min } from 'class-validator';

export class CreateChildProfileDto {
  @IsEmail()
  email: string;

  @IsString()
  display_name: string;

  @IsInt()
  @Min(3)
  @Max(12)
  age: number;

  @IsEnum(['3_5', '6_8', '9_12'])
  age_group: '3_5' | '6_8' | '9_12';

  @IsString()
  relationship: string;
}

