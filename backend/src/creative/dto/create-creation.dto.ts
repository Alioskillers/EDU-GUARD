import { IsEnum, IsString, IsUUID } from 'class-validator';

export class CreateCreationDto {
  @IsUUID()
  child_id: string;

  @IsString()
  title: string;

  @IsEnum(['STORY', 'DRAWING', 'CODE'])
  type: 'STORY' | 'DRAWING' | 'CODE';

  @IsString()
  content: string;
}

