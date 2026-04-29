import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateSubscriptionDto } from './create-subscription.dto';
import { SubscriptionStatus } from '../../../../generated/prisma/enums.js';

export class UpdateSubscriptionDto extends PartialType(CreateSubscriptionDto) {
  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus;
}
