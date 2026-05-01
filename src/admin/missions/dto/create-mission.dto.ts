import { IsString, IsOptional, IsInt, IsBoolean, IsEnum, IsArray, Min } from 'class-validator';
import { MissionCategory, MissionStatus } from '../../../../generated/prisma/enums.js';

export class CreateMissionDto {
  @IsEnum(MissionCategory)
  category: MissionCategory;

  @IsString()
  title: string;

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
  @Min(1)
  limitCount?: number;

  @IsOptional()
  @IsString()
  startAt?: string;

  @IsOptional()
  @IsString()
  endAt?: string;

  @IsOptional()
  @IsEnum(MissionStatus)
  status?: MissionStatus;
}
