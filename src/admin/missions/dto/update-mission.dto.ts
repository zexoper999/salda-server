import { IsString, IsOptional, IsInt, IsBoolean, IsEnum, IsArray, Min } from 'class-validator';
import { MissionCategory, MissionStatus } from '../../../../generated/prisma/enums.js';

export class UpdateMissionDto {
  @IsOptional()
  @IsEnum(MissionCategory)
  category?: MissionCategory;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  publisher?: string;

  @IsOptional()
  @IsString()
  oneLineDesc?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  imageUrls?: string[];

  @IsOptional()
  @IsString()
  missionUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  rewardPoint?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  rewardTicket?: number;

  @IsOptional()
  @IsBoolean()
  ageRestriction?: boolean;

  @IsOptional()
  @IsBoolean()
  isFirstCome?: boolean;

  @IsOptional()
  @IsInt()
  limitCount?: number | null;

  @IsOptional()
  @IsString()
  startAt?: string | null;

  @IsOptional()
  @IsString()
  endAt?: string | null;

  @IsOptional()
  @IsEnum(MissionStatus)
  status?: MissionStatus;
}
