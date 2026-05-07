import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionType } from '../../generated/prisma/enums.js';
import type { Request } from 'express';

interface JwtPayload {
  userId: number;
  kakaoId: string;
}

@Controller('subscriptions')
@UseGuards(AuthGuard('jwt'))
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  // GET /subscriptions?type=JEONSE|VEHICLE — 청약 목록
  @Get()
  findAll(@Query('type') type: SubscriptionType | undefined, @Req() req: Request) {
    const { userId } = req.user as JwtPayload;
    return this.subscriptionsService.findAll(type, userId);
  }

  // GET /subscriptions/my/entries — 내 응모 내역
  // 주의: /:id 보다 먼저 선언해야 라우트 충돌 없음
  @Get('my/entries')
  findMyEntries(@Req() req: Request) {
    const { userId } = req.user as JwtPayload;
    return this.subscriptionsService.findMyEntries(userId);
  }

  // GET /subscriptions/setting — 내 청약 설정 조회
  @Get('setting')
  getSubscriptionSetting(@Req() req: Request) {
    const { userId } = req.user as JwtPayload;
    return this.subscriptionsService.getSubscriptionSetting(userId);
  }

  // GET /subscriptions/:id — 청약 상세 + 내 점유율
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const { userId } = req.user as JwtPayload;
    return this.subscriptionsService.findOne(id, userId);
  }

  // POST /subscriptions/:id/set — 청약 설정 (1인 1청약)
  @Post(':id/set')
  setSubscription(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const { userId } = req.user as JwtPayload;
    return this.subscriptionsService.setSubscription(id, userId);
  }

  // POST /subscriptions/:id/enter — 직접 응모 (⚠️ 정책 보류, 현재 비활성)
  @Post(':id/enter')
  enter(@Param('id', ParseIntPipe) id: number, @Req() req: Request, @Body() dto: unknown) {
    const { userId } = req.user as JwtPayload;
    return this.subscriptionsService.enter(id, userId, dto);
  }
}
