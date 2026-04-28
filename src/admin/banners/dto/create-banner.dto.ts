import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateBannerDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsDateString()
  startAt: string;

  @IsDateString()
  endAt: string;
}
