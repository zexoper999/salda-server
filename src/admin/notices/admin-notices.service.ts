import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service.js';
import { CreateNoticeDto } from './dto/create-notice.dto.js';
import { UpdateNoticeDto } from './dto/update-notice.dto.js';

@Injectable()
export class AdminNoticesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(page: number, limit: number, search?: string) {
    const where = search
      ? { title: { contains: search, mode: 'insensitive' as const } }
      : {};

    const [total, notices] = await Promise.all([
      this.prisma.client.notice.count({ where }),
      this.prisma.client.notice.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          isVisible: true,
          viewCount: true,
          createdAt: true,
        },
      }),
    ]);

    return { status: 'success', data: { notices, total } };
  }

  async findOne(id: number) {
    const notice = await this.prisma.client.notice.findUnique({ where: { id } });
    if (!notice) throw new NotFoundException('공지사항을 찾을 수 없습니다.');
    return { status: 'success', data: notice };
  }

  async create(dto: CreateNoticeDto) {
    const notice = await this.prisma.client.notice.create({
      data: {
        title: dto.title,
        content: dto.content,
        isVisible: dto.isVisible ?? true,
      },
    });
    return { status: 'success', data: notice };
  }

  async update(id: number, dto: UpdateNoticeDto) {
    const notice = await this.prisma.client.notice.findUnique({ where: { id } });
    if (!notice) throw new NotFoundException('공지사항을 찾을 수 없습니다.');

    const updated = await this.prisma.client.notice.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.content !== undefined && { content: dto.content }),
        ...(dto.isVisible !== undefined && { isVisible: dto.isVisible }),
      },
    });
    return { status: 'success', data: updated };
  }

  async remove(id: number) {
    const notice = await this.prisma.client.notice.findUnique({ where: { id } });
    if (!notice) throw new NotFoundException('공지사항을 찾을 수 없습니다.');
    await this.prisma.client.notice.delete({ where: { id } });
    return { status: 'success' };
  }
}
