/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateMissionDto } from './dto/create-mission.dto';
import { CompleteMissionDto } from './dto/complete-mission.dto';

@Injectable()
export class MissionsService {
  constructor(private readonly prisma: PrismaService) {}

  // 미션 전체 목록 조회
  findAll() {
    return this.prisma.client.mission.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  // 미션 단건 조회
  async findOne(id: number) {
    const mission = await this.prisma.client.mission.findUnique({
      where: { id },
    });
    if (!mission)
      throw new NotFoundException(`Mission #${id} 을 찾을 수 없습니다.`);
    return mission;
  }

  // 미션 생성 (관리자용)
  create(dto: CreateMissionDto) {
    return this.prisma.client.mission.create({
      data: dto,
    });
  }

  // 미션 완료 처리
  async complete(dto: CompleteMissionDto) {
    // 미션 존재 여부 확인
    await this.findOne(dto.missionId);

    // 이미 완료한 미션인지 확인 (@@unique 제약 활용)
    const existing = await this.prisma.client.userMission.findUnique({
      where: {
        userId_missionId: {
          userId: dto.userId,
          missionId: dto.missionId,
        },
      },
    });
    if (existing) throw new ConflictException('이미 완료한 미션입니다.');

    return this.prisma.client.userMission.create({
      data: {
        userId: dto.userId,
        missionId: dto.missionId,
      },
    });
  }

  // 유저별 완료한 미션 목록 조회
  findCompletedByUser(userId: number) {
    return this.prisma.client.userMission.findMany({
      where: { userId },
      include: { mission: true },
    });
  }
}
