import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';

@Injectable()
export class FaqService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const faqs = await this.prisma.client.faq.findMany({
      where: { isVisible: true },
      orderBy: [{ order: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        question: true,
        answer: true,
      },
    });
    return { status: 'success', data: faqs };
  }
}
