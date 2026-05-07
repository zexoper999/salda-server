import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { MissionStatus } from '../../generated/prisma/enums.js';
import { CreateMissionDto } from './dto/create-mission.dto';

@Injectable()
export class MissionsService {
  constructor(private readonly prisma: PrismaService) {}

  // 미션 전체 목록 (랜덤 순서, 오늘 완료 여부 포함)
  async findAll(userId: number) {
    const missions = await this.prisma.client.mission.findMany({
      where: { status: MissionStatus.ACTIVE },
    });

    const completedToday = await this.prisma.client.userMission.findMany({
      where: {
        userId,
        completedAt: { gte: this.getTodayStart(), lte: this.getTodayEnd() },
      },
      select: { missionId: true },
    });

    const completedIds = new Set(completedToday.map((m) => m.missionId));
    const result = missions.map((m) => ({
      ...m,
      completedToday: completedIds.has(m.id),
    }));

    return { status: 'success', data: this.shuffle(result) };
  }

  // 선착순 미션 목록
  async findFirstCome(userId: number) {
    const missions = await this.prisma.client.mission.findMany({
      where: { status: MissionStatus.ACTIVE, isFirstCome: true },
    });

    const withMeta = await Promise.all(
      missions.map(async (m) => {
        const completedCount = await this.prisma.client.userMission.count({
          where: { missionId: m.id },
        });
        const completedToday =
          (await this.prisma.client.userMission.count({
            where: {
              userId,
              missionId: m.id,
              completedAt: { gte: this.getTodayStart(), lte: this.getTodayEnd() },
            },
          })) > 0;

        return {
          ...m,
          completedCount,
          remainCount: m.limitCount !== null ? m.limitCount - completedCount : null,
          completedToday,
        };
      }),
    );

    return { status: 'success', data: withMeta };
  }

  // 미션 단건 조회
  async findOne(id: number, userId: number) {
    const mission = await this.prisma.client.mission.findUnique({ where: { id } });
    if (!mission) throw new NotFoundException('미션을 찾을 수 없습니다.');

    const completedToday =
      (await this.prisma.client.userMission.count({
        where: {
          userId,
          missionId: id,
          completedAt: { gte: this.getTodayStart(), lte: this.getTodayEnd() },
        },
      })) > 0;

    return { status: 'success', data: { ...mission, completedToday } };
  }

  // 미션 완료 처리
  async complete(userId: number, missionId: number) {
    const mission = await this.prisma.client.mission.findUnique({ where: { id: missionId } });
    if (!mission) throw new NotFoundException('미션을 찾을 수 없습니다.');

    if (mission.status !== MissionStatus.ACTIVE) {
      throw new BadRequestException('진행 중인 미션이 아닙니다.');
    }

    const now = new Date();
    if (mission.startAt && now < mission.startAt) {
      throw new BadRequestException('아직 시작되지 않은 미션입니다.');
    }
    if (mission.endAt && now > mission.endAt) {
      throw new BadRequestException('종료된 미션입니다.');
    }

    if (mission.ageRestriction) {
      const user = await this.prisma.client.user.findUnique({ where: { id: userId } });
      if (!user?.birthYear) {
        throw new ForbiddenException(
          '생년 정보가 없어 참여할 수 없습니다. 마이페이지에서 생년을 등록해 주세요.',
        );
      }
      if (new Date().getFullYear() - user.birthYear < 19) {
        throw new ForbiddenException('만 19세 미만은 참여할 수 없는 미션입니다.');
      }
    }

    const existingToday = await this.prisma.client.userMission.findFirst({
      where: {
        userId,
        missionId,
        completedAt: { gte: this.getTodayStart(), lte: this.getTodayEnd() },
      },
    });
    if (existingToday) {
      throw new ConflictException('오늘 이미 완료한 미션입니다. 내일 다시 도전하세요.');
    }

    if (mission.isFirstCome && mission.limitCount !== null) {
      const count = await this.prisma.client.userMission.count({ where: { missionId } });
      if (count >= mission.limitCount) throw new ConflictException('선착순이 마감되었습니다.');
    }

    return this.prisma.client.$transaction(async (tx) => {
      // 1. 미션 완료 기록
      await tx.userMission.create({ data: { userId, missionId } });

      // 2. 포인트 지급
      const updated = await tx.user.update({
        where: { id: userId },
        data: {
          point: { increment: mission.rewardPoint },
          totalEarnedPoint: { increment: mission.rewardPoint },
        },
      });

      // 3. 설정된 청약 조회 (반드시 1개 존재)
      const setting = await tx.userSubscriptionSetting.findUnique({ where: { userId } });
      if (!setting) throw new BadRequestException('설정된 청약이 없습니다.');

      // 4. 청약별 진행 상태 업데이트
      // rewardTicket = 이번 미션의 조각 수 (미션마다 다를 수 있음)
      const piecesEarned = mission.rewardTicket;
      const progress = await tx.userSubscriptionProgress.upsert({
        where: { userId_subscriptionId: { userId, subscriptionId: setting.subscriptionId } },
        create: { userId, subscriptionId: setting.subscriptionId, missionCount: 1, totalPieces: piecesEarned },
        update: { missionCount: { increment: 1 }, totalPieces: { increment: piecesEarned } },
      });

      // 5. totalPieces가 10의 배수를 넘을 때마다 응모권 1개씩 자동 응모
      const prevTotalPieces = progress.totalPieces - piecesEarned;
      const newTicketsEarned = Math.floor(progress.totalPieces / 10) - Math.floor(prevTotalPieces / 10);

      if (newTicketsEarned > 0) {
        await tx.subscriptionEntry.createMany({
          data: Array.from({ length: newTicketsEarned }, () => ({
            userId,
            subscriptionId: setting.subscriptionId,
            ticketCount: 1,
          })),
        });
      }

      const currentPieces = progress.totalPieces % 10;
      const totalTickets = Math.floor(progress.totalPieces / 10);

      return {
        status: 'success',
        data: {
          pointEarned: mission.rewardPoint,
          totalPoint: updated.point,
          piecesEarned,
          currentPieces,
          totalTickets,
          newTicketsEarned,
        },
        message: newTicketsEarned > 0
          ? `응모권 ${newTicketsEarned}개가 자동 응모되었습니다!`
          : '미션을 완료했습니다.',
      };
    });
  }

  // 내가 완료한 미션 목록
  async findMyCompleted(userId: number) {
    const records = await this.prisma.client.userMission.findMany({
      where: { userId },
      include: {
        mission: {
          select: { id: true, title: true, rewardPoint: true, rewardTicket: true, category: true },
        },
      },
      orderBy: { completedAt: 'desc' },
    });

    return { status: 'success', data: records };
  }

  // 미션 생성 (어드민 모듈로 이전됨 — 레거시 호환용)
  async create(dto: CreateMissionDto) {
    const mission = await this.prisma.client.mission.create({
      data: { ...dto, imageUrls: dto.imageUrls ?? [] },
    });
    return { status: 'success', data: mission };
  }

  // ─── Private helpers ───────────────────────

  private getTodayStart(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private getTodayEnd(): Date {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d;
  }

  private shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}
