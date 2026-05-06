import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';

export interface UpdateSettingsDto {
  notifAll?: boolean;
  notifSubscription?: boolean;
  notifMarketing?: boolean;
  notifInfo?: boolean;
  notifNight?: boolean;
}

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings(userId: number) {
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
      select: {
        notifAll: true,
        notifSubscription: true,
        notifMarketing: true,
        notifInfo: true,
        notifNight: true,
      },
    });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');
    return { status: 'success', data: user };
  }

  async updateSettings(userId: number, dto: UpdateSettingsDto) {
    const data: Record<string, boolean> = {};
    if (dto.notifAll !== undefined) data.notifAll = dto.notifAll;
    if (dto.notifSubscription !== undefined) data.notifSubscription = dto.notifSubscription;
    if (dto.notifMarketing !== undefined) data.notifMarketing = dto.notifMarketing;
    if (dto.notifInfo !== undefined) data.notifInfo = dto.notifInfo;
    if (dto.notifNight !== undefined) data.notifNight = dto.notifNight;

    const updated = await this.prisma.client.user.update({
      where: { id: userId },
      data,
      select: {
        notifAll: true,
        notifSubscription: true,
        notifMarketing: true,
        notifInfo: true,
        notifNight: true,
      },
    });
    return { status: 'success', data: updated };
  }

  async updateFcmToken(userId: number, fcmToken: string) {
    await this.prisma.client.user.update({
      where: { id: userId },
      data: { fcmToken },
    });
    return { status: 'success' };
  }
}
