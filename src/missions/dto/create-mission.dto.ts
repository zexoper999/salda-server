import {
  IsString,
  IsOptional,
  IsInt,
  IsBoolean,
  IsEnum,
  IsDateString,
  Min,
} from 'class-validator';
import { MissionCategory } from '../../../generated/prisma/enums.js';

export class CreateMissionDto {
  @IsEnum(MissionCategory)
  category: MissionCategory;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  oneLineDesc?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  publisher?: string;

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
  @IsDateString()
  startAt?: string;

  @IsOptional()
  @IsDateString()
  endAt?: string;
}
