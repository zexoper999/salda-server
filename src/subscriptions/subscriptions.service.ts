import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { SubscriptionType } from '../../generated/prisma/enums.js';
import { EnterSubscriptionDto } from './dto/enter-subscription.dto';

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  // 청약 목록 — 타입 필터 (전세/차량), CLOSED 제외
  async findAll(type?: SubscriptionType) {
    const subscriptions = await this.prisma.client.subscription.findMany({
      where: { ...(type ? { type } : {}) },
      orderBy: { endAt: 'asc' },
    });

    return { status: 'success', data: subscriptions };
  }

  // 청약 상세 — 내 점유율 포함 (polling 대응)
  async findOne(id: number, userId: number) {
    const subscription = await this.prisma.client.subscription.findUnique({
      where: { id },
    });
    if (!subscription) throw new NotFoundException('청약을 찾을 수 없습니다.');

    // 전체 응모권 합계
    const totalAgg = await this.prisma.client.subscriptionEntry.aggregate({
      where: { subscriptionId: id },
      _sum: { ticketCount: true },
    });
    const totalTickets = totalAgg._sum.ticketCount ?? 0;

    // 내 응모권 합계
    const myAgg = await this.prisma.client.subscriptionEntry.aggregate({
      where: { subscriptionId: id, userId },
      _sum: { ticketCount: true },
    });
    const myTickets = myAgg._sum.ticketCount ?? 0;

    const myEntryRate =
      totalTickets > 0
        ? parseFloat(((myTickets / totalTickets) * 100).toFixed(2))
        : 0;

    return {
      status: 'success',
      data: { ...subscription, totalTickets, myTickets, myEntryRate },
    };
  }

  // 청약 응모 — 응모권 차감 트랜잭션
  async enter(id: number, userId: number, dto: EnterSubscriptionDto) {
    const subscription = await this.prisma.client.subscription.findUnique({
      where: { id },
    });
    if (!subscription) throw new NotFoundException('청약을 찾을 수 없습니다.');

    const now = new Date();
    if (now > subscription.endAt) {
      throw new BadRequestException('응모 기간이 종료된 청약입니다.');
    }
    if (now < subscription.startAt) {
      throw new BadRequestException('아직 응모 기간이 시작되지 않은 청약입니다.');
    }

    return this.prisma.client.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');

      if (user.ticket < dto.ticketCount) {
        throw new BadRequestException(
          `응모권이 부족합니다. 보유: ${user.ticket}장, 필요: ${dto.ticketCount}장`,
        );
      }

      // 응모권 차감
      const updated = await tx.user.update({
        where: { id: userId },
        data: { ticket: { decrement: dto.ticketCount } },
      });

      // 응모 내역 생성
      const entry = await tx.subscriptionEntry.create({
        data: { userId, subscriptionId: id, ticketCount: dto.ticketCount },
      });

      return {
        status: 'success',
        data: {
          entryId: entry.id,
          ticketUsed: dto.ticketCount,
          remainTicket: updated.ticket,
        },
        message: `응모권 ${dto.ticketCount}장으로 응모 완료!`,
      };
    });
  }

  // 내 응모 내역
  async findMyEntries(userId: number) {
    const entries = await this.prisma.client.subscriptionEntry.findMany({
      where: { userId },
      include: {
        subscription: {
          select: { id: true, type: true, title: true, status: true, endAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { status: 'success', data: entries };
  }
}
