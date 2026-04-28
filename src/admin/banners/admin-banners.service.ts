import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';

@Injectable()
export class AdminBannersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(search?: string, page = 1, limit = 20) {
    const where = search
      ? { OR: [{ title: { contains: search } }, { description: { contains: search } }] }
      : {};

    const [items, total] = await Promise.all([
      this.prisma.client.banner.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.client.banner.count({ where }),
    ]);

    return { status: 'success', data: { items, total, page, limit }, message: 'OK' };
  }

  async create(dto: CreateBannerDto) {
    const banner = await this.prisma.client.banner.create({
      data: {
        title: dto.title,
        description: dto.description,
        imageUrl: dto.imageUrl,
        startAt: new Date(dto.startAt),
        endAt: new Date(dto.endAt),
        isPublic: false,
      },
    });
    return { status: 'success', data: banner, message: '배너가 등록되었습니다.' };
  }

  async findOne(id: number) {
    const banner = await this.prisma.client.banner.findUnique({ where: { id } });
    if (!banner) throw new NotFoundException('배너를 찾을 수 없습니다.');
    return { status: 'success', data: banner, message: 'OK' };
  }

  async update(id: number, dto: UpdateBannerDto) {
    await this.findOne(id);
    const banner = await this.prisma.client.banner.update({
      where: { id },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
        ...(dto.startAt && { startAt: new Date(dto.startAt) }),
        ...(dto.endAt && { endAt: new Date(dto.endAt) }),
        ...(dto.isPublic !== undefined && { isPublic: dto.isPublic }),
      },
    });
    return { status: 'success', data: banner, message: '저장되었습니다.' };
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.client.banner.delete({ where: { id } });
    return { status: 'success', data: null, message: '삭제되었습니다.' };
  }

  // 앱 홈 화면용 — 공개 + 현재 날짜 범위 내 배너
  async findActive() {
    const now = new Date();
    const banners = await this.prisma.client.banner.findMany({
      where: { isPublic: true, startAt: { lte: now }, endAt: { gte: now } },
      orderBy: { createdAt: 'desc' },
    });
    return { status: 'success', data: banners, message: 'OK' };
  }
}
