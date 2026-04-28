import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { UpdateUserPointDto } from './dto/update-user-point.dto';

@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(page: number, limit: number, search?: string) {
    const where = search ? { name: { contains: search } } : {};

    const [total, users] = await Promise.all([
      this.prisma.client.user.count({ where }),
      this.prisma.client.user.findMany({
        where,
        orderBy: { id: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          phone: true,
          point: true,
          kakaoId: true,
          appleId: true,
          createdAt: true,
          _count: { select: { subscriptionEntries: true } },
        },
      }),
    ]);

    const data = users.map((u) => ({
      id: u.id,
      name: u.name,
      phone: u.phone,
      point: u.point,
      loginType: u.kakaoId ? '카카오로그인' : u.appleId ? '애플로그인' : '기타',
      createdAt: u.createdAt,
      entryCount: u._count.subscriptionEntries,
    }));

    return {
      status: 'success',
      data: { users: data, total, page, limit },
    };
  }

  async findOne(id: number) {
    const user = await this.prisma.client.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        phone: true,
        point: true,
        totalEarnedPoint: true,
        adjustedPoint: true,
        kakaoId: true,
        appleId: true,
        createdAt: true,
        _count: {
          select: {
            userMissions: true,
            subscriptionEntries: true,
          },
        },
      },
    });

    if (!user) throw new NotFoundException('회원을 찾을 수 없습니다.');

    const usedPoint = await this.prisma.client.purchase.aggregate({
      where: { userId: id },
      _sum: { pointUsed: true },
    });

    return {
      status: 'success',
      data: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        point: user.point,
        totalEarnedPoint: user.totalEarnedPoint,
        usedPoint: usedPoint._sum.pointUsed ?? 0,
        adjustedPoint: user.adjustedPoint,
        loginType: user.kakaoId ? '카카오로그인' : user.appleId ? '애플로그인' : '기타',
        createdAt: user.createdAt,
        missionCount: user._count.userMissions,
        entryCount: user._count.subscriptionEntries,
      },
    };
  }

  async updatePoint(id: number, dto: UpdateUserPointDto) {
    const user = await this.prisma.client.user.findUnique({
      where: { id },
      select: { point: true, adjustedPoint: true },
    });
    if (!user) throw new NotFoundException('회원을 찾을 수 없습니다.');

    const diff = dto.point - user.point;

    const updated = await this.prisma.client.user.update({
      where: { id },
      data: {
        point: dto.point,
        adjustedPoint: { increment: diff },
      },
      select: { id: true, point: true, adjustedPoint: true },
    });

    return { status: 'success', data: updated };
  }

  async remove(id: number) {
    const user = await this.prisma.client.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('회원을 찾을 수 없습니다.');

    await this.prisma.client.user.delete({ where: { id } });

    return { status: 'success', message: '회원이 탈퇴 처리되었습니다.' };
  }
}
