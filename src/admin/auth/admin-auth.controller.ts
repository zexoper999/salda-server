import { Body, Controller, Get, Post, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AdminAuthService } from './admin-auth.service';
import { AdminGuard } from '../guards/admin.guard';

@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Post('login')
  async login(
    @Body() body: { username: string; password: string },
    @Res() res: Response,
  ) {
    const token = await this.adminAuthService.login(body.username, body.password);
    if (!token) throw new UnauthorizedException('아이디 또는 비밀번호가 올바르지 않습니다.');

    res.cookie('adminToken', token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({ status: 'success', data: { username: body.username }, message: '로그인 성공' });
  }

  @Get('me')
  @UseGuards(AdminGuard)
  getMe() {
    return { status: 'success', data: { username: 'admin', role: 'ADMIN' }, message: 'OK' };
  }

  @Post('logout')
  @UseGuards(AdminGuard)
  logout(@Res() res: Response) {
    res.clearCookie('adminToken');
    return res.json({ status: 'success', data: null, message: '로그아웃 완료' });
  }
}
