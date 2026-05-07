import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

export type HistoryItem = {
  id: string;
  type: 'POINT_EARN' | 'POINT_USE' | 'TICKET_EARN' | 'TICKET_USE';
  title: string;
  subtitle: string;
  amount: number;
  sign: '+' | '-';
  currency: 'POINT' | 'TICKET';
  date: Date;
};

@Injectable()
export class HistoryService {
  constructor(private readonly prisma: PrismaService) {}

  async findMyHistory(userId: number): Promise<{ status: string; data: HistoryItem[] }> {
    const [missions, purchases, entries] = await Promise.all([
      this.prisma.client.userMission.findMany({
        where: { userId },
        include: { mission: { select: { rewardPoint: true, rewardTicket: true } } },
        orderBy: { completedAt: 'desc' },
      }),
      this.prisma.client.purchase.findMany({
        where: { userId },
        include: { product: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.client.subscriptionEntry.findMany({
        where: { userId },
        include: { subscription: { select: { title: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const items: HistoryItem[] = [];

    missions.forEach((m) => {
      if (m.mission.rewardPoint > 0) {
        items.push({
          id: `mission_point_${m.id}`,
          type: 'POINT_EARN',
          title: '포인트 획득',
          subtitle: '미션 성공',
          amount: m.mission.rewardPoint,
          sign: '+',
          currency: 'POINT',
          date: m.completedAt,
        });
      }
      if (m.mission.rewardTicket > 0) {
        items.push({
          id: `mission_ticket_${m.id}`,
          type: 'TICKET_EARN',
          title: '응모권조각 획득',
          subtitle: '미션 성공',
          amount: m.mission.rewardTicket,
          sign: '+',
          currency: 'TICKET',
          date: m.completedAt,
        });
      }
    });

    purchases.forEach((p) => {
      items.push({
        id: `purchase_${p.id}`,
        type: 'POINT_USE',
        title: '포인트 사용',
        subtitle: p.product.name,
        amount: p.pointUsed,
        sign: '-',
        currency: 'POINT',
        date: p.createdAt,
      });
    });

    entries.forEach((e) => {
      items.push({
        id: `entry_${e.id}`,
        type: 'TICKET_USE',
        title: `응모권 ${e.ticketCount}개 자동 응모`,
        subtitle: e.subscription.title,
        amount: e.ticketCount,
        sign: '-',
        currency: 'TICKET',
        date: e.createdAt,
      });
    });

    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return { status: 'success', data: items };
  }
}
