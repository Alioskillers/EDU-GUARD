import { IsString, Length, Matches } from 'class-validator';

export class LinkChildByCodeDto {
  @IsString()
  @Length(6, 6, { message: 'Guardian code must be exactly 6 digits' })
  @Matches(/^\d{6}$/, { message: 'Guardian code must contain only digits' })
  guardian_code: string;

  @IsString()
  relationship: string;
}

