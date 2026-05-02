import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateNoticeDto {
  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;
}
