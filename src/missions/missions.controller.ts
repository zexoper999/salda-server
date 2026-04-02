import { Controller, Get, Post, Body, Param, ParseIntPipe, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MissionsService } from './missions.service';
import { CreateMissionDto } from './dto/create-mission.dto';
import type { Request } from 'express';

interface JwtPayload {
  userId: number;
  kakaoId: string;
}

@Controller('missions')
@UseGuards(AuthGuard('jwt'))
export class MissionsController {
  constructor(private readonly missionsService: MissionsService) {}

  // GET /missions — 전체 미션 목록 (랜덤, 오늘 완료 여부 포함)
  @Get()
  findAll(@Req() req: Request) {
    const { userId } = req.user as JwtPayload;
    return this.missionsService.findAll(userId);
  }

  // GET /missions/first-come — 선착순 미션 목록
  // 주의: /:id 보다 먼저 선언해야 라우트 충돌 없음
  @Get('first-come')
  findFirstCome(@Req() req: Request) {
    const { userId } = req.user as JwtPayload;
    return this.missionsService.findFirstCome(userId);
  }

  // GET /missions/my/completed — 내가 완료한 미션 목록
  @Get('my/completed')
  findMyCompleted(@Req() req: Request) {
    const { userId } = req.user as JwtPayload;
    return this.missionsService.findMyCompleted(userId);
  }

  // GET /missions/:id — 미션 단건 조회
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const { userId } = req.user as JwtPayload;
    return this.missionsService.findOne(id, userId);
  }

  // POST /missions/:id/complete — 미션 완료 처리
  @Post(':id/complete')
  complete(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const { userId } = req.user as JwtPayload;
    return this.missionsService.complete(userId, id);
  }

  // POST /missions — 미션 생성 (어드민, 임시: Phase 6에서 AdminGuard로 교체 예정)
  @Post()
  create(@Body() dto: CreateMissionDto) {
    return this.missionsService.create(dto);
  }
}
