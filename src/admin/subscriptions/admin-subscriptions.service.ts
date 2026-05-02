import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { SubscriptionStatus } from '../../../generated/prisma/enums.js';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';

@Injectable()
export class AdminSubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  // 상태 자동 계산 (조회 시 스케줄러 없이 처리)
  private computeStatus(
    stored: SubscriptionStatus,
    endAt: Date,
    totalEntries: number,
    maxEntries: number,
  ): SubscriptionStatus {
    if (stored === SubscriptionStatus.CLOSED) return SubscriptionStatus.CLOSED;

    const now = new Date();
    const isExpired = now > endAt;
    const isNearLimit = maxEntries > 0 && totalEntries >= maxEntries * 0.9;

    if (isExpired || isNearLimit) return SubscriptionStatus.CLOSING_SOON;
    return SubscriptionStatus.ONGOING;
  }

  private fmtEntryCount(count: number): string {
    if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
    if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
    return String(count);
  }

  async findAll(page: number, limit: number, search?: string) {
    const where = search ? { title: { contains: search } } : {};

    const [total, subs] = await Promise.all([
      this.prisma.client.subscription.count({ where }),
      this.prisma.client.subscription.findMany({
        where,
        orderBy: { id: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { _count: { select: { entries: true } } },
      }),
    ]);

    const data = subs.map((s) => ({
      id: s.id,
      type: s.type,
      title: s.title,
      oneLineDesc: s.oneLineDesc,
      imageUrls: s.imageUrls,
      startAt: s.startAt,
      endAt: s.endAt,
      createdAt: s.createdAt,
      maxEntries: s.maxEntries,
      entryCount: s._count.entries,
      entryCountFmt: this.fmtEntryCount(s._count.entries),
      status: this.computeStatus(s.status, s.endAt, s._count.entries, s.maxEntries),
    }));

    return { status: 'success', data: { subscriptions: data, total, page, limit } };
  }

  async findOne(id: number) {
    const sub = await this.prisma.client.subscription.findUnique({
      where: { id },
      include: { _count: { select: { entries: true } } },
    });
    if (!sub) throw new NotFoundException('청약을 찾을 수 없습니다.');

    return {
      status: 'success',
      data: {
        ...sub,
        entryCount: sub._count.entries,
        status: this.computeStatus(sub.status, sub.endAt, sub._count.entries, sub.maxEntries),
      },
    };
  }

  async create(dto: CreateSubscriptionDto) {
    const sub = await this.prisma.client.subscription.create({
      data: {
        type: dto.type,
        title: dto.title,
        oneLineDesc: dto.oneLineDesc ?? null,
        description: dto.description ?? null,
        imageUrls: dto.imageUrls ?? [],
        deposit: dto.deposit,
        maxEntries: dto.maxEntries,
        bonusIncluded: dto.bonusIncluded,
        startAt: new Date(dto.startAt),
        endAt: new Date(dto.endAt),
      },
    });
    return { status: 'success', data: sub };
  }

  async update(id: number, dto: UpdateSubscriptionDto) {
    const sub = await this.prisma.client.subscription.findUnique({ where: { id } });
    if (!sub) throw new NotFoundException('청약을 찾을 수 없습니다.');

    const updated = await this.prisma.client.subscription.update({
      where: { id },
      data: {
        ...(dto.type && { type: dto.type }),
        ...(dto.title && { title: dto.title }),
        ...(dto.oneLineDesc !== undefined && { oneLineDesc: dto.oneLineDesc }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.imageUrls && { imageUrls: dto.imageUrls }),
        ...(dto.deposit !== undefined && { deposit: dto.deposit }),
        ...(dto.maxEntries !== undefined && { maxEntries: dto.maxEntries }),
        ...(dto.bonusIncluded !== undefined && { bonusIncluded: dto.bonusIncluded }),
        ...(dto.startAt && { startAt: new Date(dto.startAt) }),
        ...(dto.endAt && { endAt: new Date(dto.endAt) }),
      },
    });
    return { status: 'success', data: updated };
  }

  async close(id: number) {
    const sub = await this.prisma.client.subscription.findUnique({ where: { id } });
    if (!sub) throw new NotFoundException('청약을 찾을 수 없습니다.');
    if (sub.status === SubscriptionStatus.CLOSED) {
      throw new BadRequestException('이미 마감된 청약입니다.');
    }

    const updated = await this.prisma.client.subscription.update({
      where: { id },
      data: { status: SubscriptionStatus.CLOSED },
    });
    return { status: 'success', data: updated, message: '청약이 마감 처리되었습니다.' };
  }

  async remove(id: number) {
    const entryCount = await this.prisma.client.subscriptionEntry.count({
      where: { subscriptionId: id },
    });
    if (entryCount > 0) {
      throw new BadRequestException('응모자가 있는 청약은 삭제할 수 없습니다.');
    }

    await this.prisma.client.subscription.delete({ where: { id } });
    return { status: 'success', message: '청약이 삭제되었습니다.' };
  }
}
