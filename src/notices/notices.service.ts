import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';

@Injectable()
export class NoticesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const notices = await this.prisma.client.notice.findMany({
      where: { isVisible: true },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        createdAt: true,
      },
    });
    return { status: 'success', data: notices };
  }

  async findOne(id: number) {
    const notice = await this.prisma.client.notice.findUnique({ where: { id } });
    if (!notice || !notice.isVisible) {
      throw new NotFoundException('공지사항을 찾을 수 없습니다.');
    }

    const updated = await this.prisma.client.notice.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    return { status: 'success', data: updated };
  }
}
