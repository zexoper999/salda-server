import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { CreateInquiryDto } from './dto/create-inquiry.dto.js';

@Injectable()
export class InquiriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findMy(userId: number) {
    const inquiries = await this.prisma.client.inquiry.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, status: true, createdAt: true },
    });
    return { status: 'success', data: inquiries };
  }

  async findOne(id: number, userId: number) {
    const inquiry = await this.prisma.client.inquiry.findUnique({ where: { id } });
    if (!inquiry) throw new NotFoundException('문의를 찾을 수 없습니다.');
    if (inquiry.userId !== userId) throw new ForbiddenException('접근 권한이 없습니다.');
    return { status: 'success', data: inquiry };
  }

  async create(userId: number, dto: CreateInquiryDto) {
    const inquiry = await this.prisma.client.inquiry.create({
      data: {
        userId,
        title: dto.title,
        content: dto.content,
        ...(dto.imageUrl && { imageUrl: dto.imageUrl }),
      },
    });
    return { status: 'success', data: inquiry };
  }
}
