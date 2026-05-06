import { IsString, IsOptional, IsDateString, IsArray, IsInt, IsIn } from 'class-validator';

export class CreateNotificationDto {
  @IsString() title: string;
  @IsString() body: string;
  @IsIn(['ALL', 'SPECIFIC']) targetType: 'ALL' | 'SPECIFIC';
  @IsOptional() @IsArray() @IsInt({ each: true }) targetUserIds?: number[];
  @IsOptional() @IsDateString() sendAt?: string; // null이면 즉시발송
}
