import {
  Controller, Get, Patch, Body, Request, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NotificationsService, UpdateSettingsDto } from './notifications.service.js';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

class UpdateSettingsBodyDto implements UpdateSettingsDto {
  @IsOptional() @IsBoolean() notifAll?: boolean;
  @IsOptional() @IsBoolean() notifSubscription?: boolean;
  @IsOptional() @IsBoolean() notifMarketing?: boolean;
  @IsOptional() @IsBoolean() notifInfo?: boolean;
  @IsOptional() @IsBoolean() notifNight?: boolean;
}

class UpdateFcmTokenDto {
  @IsString() fcmToken: string;
}

@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get('settings')
  getSettings(@Request() req: { user: { userId: number } }) {
    return this.service.getSettings(req.user.userId);
  }

  @Patch('settings')
  updateSettings(
    @Request() req: { user: { userId: number } },
    @Body() dto: UpdateSettingsBodyDto,
  ) {
    return this.service.updateSettings(req.user.userId, dto);
  }

  @Patch('fcm-token')
  updateFcmToken(
    @Request() req: { user: { userId: number } },
    @Body() dto: UpdateFcmTokenDto,
  ) {
    return this.service.updateFcmToken(req.user.userId, dto.fcmToken);
  }
}
