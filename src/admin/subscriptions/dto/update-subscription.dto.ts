import { IsString, IsOptional, IsInt, IsBoolean, IsDateString, IsArray, Min } from 'class-validator';
import { SubscriptionType } from '../../../../generated/prisma/enums.js';
import { IsEnum } from 'class-validator';

// status는 PATCH로 직접 변경 불가 — CLOSED 처리는 /close 전용 엔드포인트만 허용
export class UpdateSubscriptionDto {
  @IsOptional() @IsEnum(SubscriptionType) type?: SubscriptionType;
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() oneLineDesc?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) imageUrls?: string[];
  @IsOptional() @IsInt() @Min(0) deposit?: number;
  @IsOptional() @IsInt() @Min(0) maxEntries?: number;
  @IsOptional() @IsBoolean() bonusIncluded?: boolean;
  @IsOptional() @IsDateString() startAt?: string;
  @IsOptional() @IsDateString() endAt?: string;
}
