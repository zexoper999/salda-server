import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service.js';
import { CreateNotificationDto } from './dto/create-notification.dto.js';

@Injectable()
export class AdminNotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(page: number, limit: number, search?: string) {
    const where = search
      ? { OR: [
          { title: { contains: search, mode: 'insensitive' as const } },
          { body:  { contains: search, mode: 'insensitive' as const } },
        ] }
      : {};

    const [total, notifications] = await Promise.all([
      this.prisma.client.pushNotification.count({ where }),
      this.prisma.client.pushNotification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          targets: {
            include: { user: { select: { id: true, name: true } } },
          },
        },
      }),
    ]);

    return { status: 'success', data: { notifications, total } };
  }

  async getUsers(search?: string) {
    const where = search
      ? { name: { contains: search, mode: 'insensitive' as const } }
      : {};

    const users = await this.prisma.client.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        phone: true,
        point: true,
        createdAt: true,
        kakaoId: true,
        appleId: true,
        notifAll: true,
        notifSubscription: true,
        notifMarketing: true,
        notifInfo: true,
        _count: { select: { subscriptionEntries: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return { status: 'success', data: users };
  }

  async create(dto: CreateNotificationDto) {
    const now = new Date();
    const sendAt = dto.sendAt ? new Date(dto.sendAt) : null;
    const isImmediate = !sendAt || sendAt <= now;

    const notification = await this.prisma.client.pushNotification.create({
      data: {
        title: dto.title,
        body: dto.body,
        targetType: dto.targetType,
        status: isImmediate ? 'SENT' : 'PENDING',
        sendAt: sendAt,
        sentAt: isImmediate ? now : null,
        ...(dto.targetType === 'SPECIFIC' && dto.targetUserIds?.length ? {
          targets: {
            create: dto.targetUserIds.map((userId) => ({ userId })),
          },
        } : {}),
      },
    });
    return { status: 'success', data: notification };
  }

  async remove(id: number) {
    const n = await this.prisma.client.pushNotification.findUnique({ where: { id } });
    if (!n) throw new NotFoundException('알림을 찾을 수 없습니다.');
    await this.prisma.client.pushNotification.delete({ where: { id } });
    return { status: 'success' };
  }
}
