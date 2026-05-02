import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service.js';

@Injectable()
export class AdminInquiriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(page: number, limit: number, search?: string) {
    const where = search
      ? { user: { name: { contains: search, mode: 'insensitive' as const } } }
      : {};

    const [total, inquiries] = await Promise.all([
      this.prisma.client.inquiry.count({ where }),
      this.prisma.client.inquiry.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
          user: { select: { name: true, phone: true } },
        },
      }),
    ]);

    return { status: 'success', data: { inquiries, total } };
  }

  async findOne(id: number) {
    const inquiry = await this.prisma.client.inquiry.findUnique({
      where: { id },
      include: { user: { select: { name: true, phone: true } } },
    });
    if (!inquiry) throw new NotFoundException('문의를 찾을 수 없습니다.');
    return { status: 'success', data: inquiry };
  }

  async reply(id: number, answer: string) {
    const inquiry = await this.prisma.client.inquiry.findUnique({ where: { id } });
    if (!inquiry) throw new NotFoundException('문의를 찾을 수 없습니다.');

    const updated = await this.prisma.client.inquiry.update({
      where: { id },
      data: { answer, status: 'ANSWERED' },
    });
    return { status: 'success', data: updated };
  }

  async remove(id: number) {
    const inquiry = await this.prisma.client.inquiry.findUnique({ where: { id } });
    if (!inquiry) throw new NotFoundException('문의를 찾을 수 없습니다.');
    await this.prisma.client.inquiry.delete({ where: { id } });
    return { status: 'success' };
  }
}
