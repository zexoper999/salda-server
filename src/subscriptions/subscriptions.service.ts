import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { SubscriptionType, SubscriptionStatus } from '../../generated/prisma/enums.js';

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  private computeStatus(
    stored: SubscriptionStatus,
    endAt: Date,
    totalEntries: number,
    maxEntries: number,
  ): SubscriptionStatus {
    if (stored === SubscriptionStatus.CLOSED) return SubscriptionStatus.CLOSED;
    const now = new Date();
    if (now > endAt || (maxEntries > 0 && totalEntries >= maxEntries * 0.9))
      return SubscriptionStatus.CLOSING_SOON;
    return SubscriptionStatus.ONGOING;
  }

  private buildProgress(p: { missionCount: number; totalPieces: number } | null) {
    if (!p) return { missionCount: 0, totalPieces: 0, currentPieces: 0, totalTickets: 0 };
    return {
      missionCount: p.missionCount,
      totalPieces: p.totalPieces,
      currentPieces: p.totalPieces % 10,
      totalTickets: Math.floor(p.totalPieces / 10),
    };
  }

  // 청약 목록 — 타입 필터, 청약별 진행 상태 + 내 설정 여부 포함
  async findAll(type: SubscriptionType | undefined, userId: number) {
    const subscriptions = await this.prisma.client.subscription.findMany({
      where: { ...(type ? { type } : {}) },
      orderBy: { endAt: 'asc' },
      include: { _count: { select: { entries: true } } },
    });

    const [setting, progresses, userEntries] = await Promise.all([
      this.prisma.client.userSubscriptionSetting.findUnique({ where: { userId } }),
      this.prisma.client.userSubscriptionProgress.findMany({ where: { userId } }),
      this.prisma.client.subscriptionEntry.groupBy({
        by: ['subscriptionId'],
        where: { userId },
        _count: { id: true },
      }),
    ]);

    const progressMap = new Map(progresses.map((p) => [p.subscriptionId, p]));
    const entryCountMap = new Map(userEntries.map((e) => [e.subscriptionId, e._count.id]));

    const items = subscriptions.map(({ _count, ...sub }) => {
      const totalEntryCount = _count.entries;
      const entryProgress =
        sub.maxEntries > 0
          ? parseFloat(((totalEntryCount / sub.maxEntries) * 100).toFixed(1))
          : 0;
      return {
        ...sub,
        status: this.computeStatus(sub.status, sub.endAt, totalEntryCount, sub.maxEntries),
        totalEntryCount,
        entryProgress,
        myEntryCount: entryCountMap.get(sub.id) ?? 0,
        isMySubscription: setting?.subscriptionId === sub.id,
        myProgress: this.buildProgress(progressMap.get(sub.id) ?? null),
      };
    });

    return { status: 'success', data: { subscriptions: items } };
  }

  // 청약 상세 — 내 참여율 + 응모달성률 + 내 미션 진행 상태 포함
  async findOne(id: number, userId: number) {
    const subscription = await this.prisma.client.subscription.findUnique({ where: { id } });
    if (!subscription) throw new NotFoundException('청약을 찾을 수 없습니다.');

    const totalEntryCount = await this.prisma.client.subscriptionEntry.count({
      where: { subscriptionId: id },
    });

    const [totalAgg, myAgg, setting, progress] = await Promise.all([
      this.prisma.client.subscriptionEntry.aggregate({
        where: { subscriptionId: id },
        _sum: { ticketCount: true },
      }),
      this.prisma.client.subscriptionEntry.aggregate({
        where: { subscriptionId: id, userId },
        _sum: { ticketCount: true },
      }),
      this.prisma.client.userSubscriptionSetting.findUnique({ where: { userId } }),
      this.prisma.client.userSubscriptionProgress.findUnique({
        where: { userId_subscriptionId: { userId, subscriptionId: id } },
      }),
    ]);

    const totalTickets = totalAgg._sum.ticketCount ?? 0;
    const myTickets = myAgg._sum.ticketCount ?? 0;
    const myEntryRate =
      totalTickets > 0 ? parseFloat(((myTickets / totalTickets) * 100).toFixed(4)) : 0;
    const entryProgress =
      subscription.maxEntries > 0
        ? parseFloat(((totalEntryCount / subscription.maxEntries) * 100).toFixed(1))
        : 0;

    return {
      status: 'success',
      data: {
        ...subscription,
        status: this.computeStatus(subscription.status, subscription.endAt, totalEntryCount, subscription.maxEntries),
        totalEntryCount,
        totalTickets,
        myTickets,
        myEntryRate,
        entryProgress,
        isMySubscription: setting?.subscriptionId === id,
        myProgress: this.buildProgress(progress),
      },
    };
  }

  // 청약 설정 — 유저의 현재 청약 설정 (1인 1청약)
  async setSubscription(subscriptionId: number, userId: number) {
    const subscription = await this.prisma.client.subscription.findUnique({
      where: { id: subscriptionId },
    });
    if (!subscription) throw new NotFoundException('청약을 찾을 수 없습니다.');

    const entryCount = await this.prisma.client.subscriptionEntry.count({
      where: { subscriptionId },
    });
    const computed = this.computeStatus(
      subscription.status,
      subscription.endAt,
      entryCount,
      subscription.maxEntries,
    );
    if (computed === SubscriptionStatus.CLOSED) {
      throw new BadRequestException('마감된 청약은 설정할 수 없습니다.');
    }

    const setting = await this.prisma.client.userSubscriptionSetting.upsert({
      where: { userId },
      create: { userId, subscriptionId },
      update: { subscriptionId, setAt: new Date() },
    });

    return { status: 'success', data: setting, message: '청약 설정이 완료되었습니다.' };
  }

  // 내 청약 설정 조회 — 설정된 청약 + 진행 상태
  async getSubscriptionSetting(userId: number) {
    const setting = await this.prisma.client.userSubscriptionSetting.findUnique({
      where: { userId },
      include: { subscription: true },
    });
    if (!setting) return { status: 'success', data: null };

    const progress = await this.prisma.client.userSubscriptionProgress.findUnique({
      where: { userId_subscriptionId: { userId, subscriptionId: setting.subscriptionId } },
    });

    return {
      status: 'success',
      data: { ...setting, progress: this.buildProgress(progress) },
    };
  }

  // 내 응모 내역
  async findMyEntries(userId: number) {
    const entries = await this.prisma.client.subscriptionEntry.findMany({
      where: { userId },
      include: {
        subscription: { select: { id: true, type: true, title: true, status: true, endAt: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return { status: 'success', data: entries };
  }

  // 직접 응모 — ⚠️ 보류 (정책 확정 전까지 비활성)
  async enter(_id: number, _userId: number, _dto: unknown) {
    throw new BadRequestException(
      '직접 응모 기능은 현재 지원되지 않습니다. 미션 완료 시 자동으로 응모됩니다.',
    );
  }
}
