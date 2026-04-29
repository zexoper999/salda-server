import { IsString, IsOptional, IsInt, IsBoolean, IsDateString, IsArray, IsEnum, Min } from 'class-validator';
import { SubscriptionType } from '../../../../generated/prisma/enums.js';

export class CreateSubscriptionDto {
  @IsEnum(SubscriptionType)
  type: SubscriptionType;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  oneLineDesc?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];

  @IsInt()
  @Min(0)
  deposit: number;

  @IsInt()
  @Min(0)
  maxEntries: number;

  @IsBoolean()
  bonusIncluded: boolean;

  @IsDateString()
  startAt: string;

  @IsDateString()
  endAt: string;
}
