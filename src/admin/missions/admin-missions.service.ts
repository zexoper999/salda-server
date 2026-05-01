import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { MissionStatus } from '../../../generated/prisma/enums.js';
import { CreateMissionDto } from './dto/create-mission.dto';
import { UpdateMissionDto } from './dto/update-mission.dto';

function fmtCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(n);
}

@Injectable()
export class AdminMissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(page: number, limit: number, search?: string) {
    const where = search ? { title: { contains: search, mode: 'insensitive' as const } } : {};

    const [total, missions] = await Promise.all([
      this.prisma.client.mission.count({ where }),
      this.prisma.client.mission.findMany({
        where,
        orderBy: { id: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { _count: { select: { userMissions: true } } },
      }),
    ]);

    const items = missions.map(({ _count, ...m }) => ({
      ...m,
      successCount: _count.userMissions,
      successCountFmt: fmtCount(_count.userMissions),
    }));

    return { status: 'success', data: { missions: items, total } };
  }

  async findOne(id: number, participantPage = 1, participantLimit = 10, search?: string) {
    const mission = await this.prisma.client.mission.findUnique({ where: { id } });
    if (!mission) throw new NotFoundException('미션을 찾을 수 없습니다.');

    const where = {
      missionId: id,
      ...(search
        ? { user: { name: { contains: search, mode: 'insensitive' as const } } }
        : {}),
    };

    const [participants, participantTotal] = await Promise.all([
      this.prisma.client.userMission.findMany({
        where,
        orderBy: { completedAt: 'desc' },
        skip: (participantPage - 1) * participantLimit,
        take: participantLimit,
        include: {
          user: {
            select: {
              name: true,
              phone: true,
              point: true,
              kakaoId: true,
              appleId: true,
              createdAt: true,
              subscriptionEntries: { select: { id: true } },
            },
          },
        },
      }),
      this.prisma.client.userMission.count({ where }),
    ]);

    const successTotal = await this.prisma.client.userMission.count({
      where: { missionId: id, success: true },
    });

    const items = participants.map((p) => ({
      id: p.id,
      success: p.success,
      completedAt: p.completedAt,
      name: p.user.name,
      phone: p.user.phone,
      point: p.user.point,
      entryCount: p.user.subscriptionEntries.length,
      joinedAt: p.user.createdAt,
      loginType: p.user.kakaoId ? '카카오로그인' : p.user.appleId ? '애플로그인' : '기타',
    }));

    return {
      status: 'success',
      data: {
        mission,
        participants: items,
        participantTotal,
        successTotal,
        successTotalFmt: fmtCount(successTotal),
      },
    };
  }

  async create(dto: CreateMissionDto) {
    const mission = await this.prisma.client.mission.create({
      data: {
        category: dto.category,
        title: dto.title,
        publisher: dto.publisher ?? null,
        oneLineDesc: dto.oneLineDesc ?? null,
        description: dto.description ?? null,
        imageUrls: dto.imageUrls ?? [],
        missionUrl: dto.missionUrl ?? null,
        rewardPoint: dto.rewardPoint ?? 0,
        rewardTicket: dto.rewardTicket ?? 0,
        ageRestriction: dto.ageRestriction ?? false,
        isFirstCome: dto.isFirstCome ?? false,
        limitCount: dto.limitCount ?? null,
        startAt: dto.startAt ? new Date(dto.startAt) : null,
        endAt: dto.endAt ? new Date(dto.endAt) : null,
        status: dto.status ?? MissionStatus.INACTIVE,
      },
    });
    return { status: 'success', data: mission };
  }

  async update(id: number, dto: UpdateMissionDto) {
    const mission = await this.prisma.client.mission.findUnique({ where: { id } });
    if (!mission) throw new NotFoundException('미션을 찾을 수 없습니다.');

    const updated = await this.prisma.client.mission.update({
      where: { id },
      data: {
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.publisher !== undefined && { publisher: dto.publisher }),
        ...(dto.oneLineDesc !== undefined && { oneLineDesc: dto.oneLineDesc }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.imageUrls !== undefined && { imageUrls: dto.imageUrls }),
        ...(dto.missionUrl !== undefined && { missionUrl: dto.missionUrl }),
        ...(dto.rewardPoint !== undefined && { rewardPoint: dto.rewardPoint }),
        ...(dto.rewardTicket !== undefined && { rewardTicket: dto.rewardTicket }),
        ...(dto.ageRestriction !== undefined && { ageRestriction: dto.ageRestriction }),
        ...(dto.isFirstCome !== undefined && { isFirstCome: dto.isFirstCome }),
        ...('limitCount' in dto && { limitCount: dto.limitCount }),
        ...('startAt' in dto && { startAt: dto.startAt ? new Date(dto.startAt) : null }),
        ...('endAt' in dto && { endAt: dto.endAt ? new Date(dto.endAt) : null }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
    });
    return { status: 'success', data: updated };
  }

  async remove(id: number) {
    const count = await this.prisma.client.userMission.count({ where: { missionId: id } });
    if (count > 0) throw new BadRequestException('참여자가 있는 미션은 삭제할 수 없습니다.');

    await this.prisma.client.mission.delete({ where: { id } });
    return { status: 'success' };
  }
}
