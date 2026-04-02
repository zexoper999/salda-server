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
      await tx.userMission.create({ data: { userId, missionId } });

      const totalCompleted = await tx.userMission.count({ where: { userId } });
      const bonusTicket = totalCompleted % 10 === 0 ? 3 : 0;

      const updated = await tx.user.update({
        where: { id: userId },
        data: {
          point: { increment: mission.rewardPoint },
          ticket: { increment: mission.rewardTicket + bonusTicket },
        },
      });

      return {
        status: 'success',
        data: {
          pointEarned: mission.rewardPoint,
          ticketEarned: mission.rewardTicket,
          bonusTicket,
          totalPoint: updated.point,
          totalTicket: updated.ticket,
        },
        message:
          bonusTicket > 0
            ? `미션 완료! 10회 달성 보너스 응모권 ${bonusTicket}장이 추가 지급되었습니다.`
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

  // 미션 생성 (어드민)
  async create(dto: CreateMissionDto) {
    const mission = await this.prisma.client.mission.create({ data: dto });
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
