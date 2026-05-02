import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateNoticeDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;
}
