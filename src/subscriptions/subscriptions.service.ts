import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { SubscriptionType, SubscriptionStatus } from '../../generated/prisma/enums.js';
import { EnterSubscriptionDto } from './dto/enter-subscription.dto';

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  private computeStatus(stored: SubscriptionStatus, endAt: Date, totalEntries: number, maxEntries: number): SubscriptionStatus {
    if (stored === SubscriptionStatus.CLOSED) return SubscriptionStatus.CLOSED;
    const now = new Date();
    if (now > endAt || (maxEntries > 0 && totalEntries >= maxEntries * 0.9)) return SubscriptionStatus.CLOSING_SOON;
    return SubscriptionStatus.ONGOING;
  }

  // 청약 목록 — 타입 필터, 각 청약의 응모달성률 + 사용자 미션진행도 포함
  async findAll(type: SubscriptionType | undefined, userId: number) {
    const subscriptions = await this.prisma.client.subscription.findMany({
      where: { ...(type ? { type } : {}) },
      orderBy: { endAt: 'asc' },
      include: { _count: { select: { entries: true } } },
    });

    // 사용자 전체 미션 완료 횟수 → 10으로 나눈 나머지 = 현재 사이클 진행도
    const totalMissions = await this.prisma.client.userMission.count({
      where: { userId },
    });
    const missionCount = totalMissions % 10;

    const userEntries = await this.prisma.client.subscriptionEntry.groupBy({
      by: ['subscriptionId'],
      where: { userId },
      _count: { id: true },
    });
    const entryCountMap = new Map(userEntries.map((e) => [e.subscriptionId, e._count.id]));

    const items = subscriptions.map(({ _count, ...sub }) => {
      const totalEntryCount = _count.entries;
      const entryProgress =
        sub.maxEntries > 0
          ? parseFloat(((totalEntryCount / sub.maxEntries) * 100).toFixed(1))
          : 0;
      const myEntryCount = entryCountMap.get(sub.id) ?? 0;
      return { ...sub, status: this.computeStatus(sub.status, sub.endAt, totalEntryCount, sub.maxEntries), totalEntryCount, entryProgress, myEntryCount };
    });

    return {
      status: 'success',
      data: { subscriptions: items, missionCount },
    };
  }

  // 청약 상세 — 내 참여율 + 응모달성률 포함 (polling 대응)
  async findOne(id: number, userId: number) {
    const subscription = await this.prisma.client.subscription.findUnique({
      where: { id },
    });
    if (!subscription) throw new NotFoundException('청약을 찾을 수 없습니다.');

    // 전체 응모 건수 (SubscriptionEntry row 수)
    const totalEntryCount = await this.prisma.client.subscriptionEntry.count({
      where: { subscriptionId: id },
    });

    // 전체 응모권 합계 (내 참여율 계산용)
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

    // 내 참여율 = 내 응모권 / 전체 응모권
    const myEntryRate =
      totalTickets > 0
        ? parseFloat(((myTickets / totalTickets) * 100).toFixed(2))
        : 0;

    // 응모달성률 = 전체 응모 건수 / 목표 응모수
    const entryProgress =
      subscription.maxEntries > 0
        ? parseFloat(((totalEntryCount / subscription.maxEntries) * 100).toFixed(1))
        : 0;

    const myEntryCount = await this.prisma.client.subscriptionEntry.count({
      where: { subscriptionId: id, userId },
    });

    return {
      status: 'success',
      data: {
        ...subscription,
        status: this.computeStatus(subscription.status, subscription.endAt, totalEntryCount, subscription.maxEntries),
        totalEntryCount,
        totalTickets,
        myTickets,
        myEntryRate,
        myEntryCount,
        entryProgress,
      },
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

      const updated = await tx.user.update({
        where: { id: userId },
        data: { ticket: { decrement: dto.ticketCount } },
      });

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
