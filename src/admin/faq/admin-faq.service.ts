import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service.js';
import { CreateFaqDto } from './dto/create-faq.dto.js';
import { UpdateFaqDto } from './dto/update-faq.dto.js';

@Injectable()
export class AdminFaqService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(page: number, limit: number, search?: string) {
    const where = search
      ? { question: { contains: search, mode: 'insensitive' as const } }
      : {};

    const [total, faqs] = await Promise.all([
      this.prisma.client.faq.count({ where }),
      this.prisma.client.faq.findMany({
        where,
        orderBy: [{ order: 'asc' }, { id: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          question: true,
          isVisible: true,
          order: true,
          createdAt: true,
        },
      }),
    ]);

    return { status: 'success', data: { faqs, total } };
  }

  async findOne(id: number) {
    const faq = await this.prisma.client.faq.findUnique({ where: { id } });
    if (!faq) throw new NotFoundException('FAQ를 찾을 수 없습니다.');
    return { status: 'success', data: faq };
  }

  async create(dto: CreateFaqDto) {
    const faq = await this.prisma.client.faq.create({
      data: {
        question: dto.question,
        answer: dto.answer,
        order: dto.order ?? 0,
        isVisible: dto.isVisible ?? true,
      },
    });
    return { status: 'success', data: faq };
  }

  async update(id: number, dto: UpdateFaqDto) {
    const faq = await this.prisma.client.faq.findUnique({ where: { id } });
    if (!faq) throw new NotFoundException('FAQ를 찾을 수 없습니다.');

    const updated = await this.prisma.client.faq.update({
      where: { id },
      data: {
        ...(dto.question !== undefined && { question: dto.question }),
        ...(dto.answer !== undefined && { answer: dto.answer }),
        ...(dto.order !== undefined && { order: dto.order }),
        ...(dto.isVisible !== undefined && { isVisible: dto.isVisible }),
      },
    });
    return { status: 'success', data: updated };
  }

  async remove(id: number) {
    const faq = await this.prisma.client.faq.findUnique({ where: { id } });
    if (!faq) throw new NotFoundException('FAQ를 찾을 수 없습니다.');
    await this.prisma.client.faq.delete({ where: { id } });
    return { status: 'success' };
  }
}
