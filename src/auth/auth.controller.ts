import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import type { Request, Response } from 'express';
import { UsersService } from '../users/users.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  //auth/kakao 요청이 오면 카카오 로그인 시작
  // ① 카카오 로그인 시작 (이 URL로 접속하면 카카오 로그인 페이지로 자동 이동)
  @Get('kakao')
  @UseGuards(AuthGuard('kakao')) // Passport가 'kakao' 전략 실행
  kakaoLogin() {
    // Passport가 자동으로 카카오 로그인 페이지로 리다이렉트
  }

  // ③ 카카오 서버에서 인가코드와 함께 돌아오는 콜백
  @Get('kakao/callback')
  @UseGuards(AuthGuard('kakao'))
  kakaoCallback(@Req() req: Request, @Res() res: Response) {
    const user = req.user as { id: number; kakaoId: string };

    // JWT 토큰 발급
    const token = this.authService.generateToken(user);

    // 쿠키에 JWT 저장 후 프론트로 리다이렉트
    res.cookie('accessToken', token, {
      httpOnly: true, // JavaScript에서 접근 불가 (XSS 방어)
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
    });

    // 로그인 완료 후 프론트 메인 페이지로 이동
    return res.redirect(process.env.CLIENT_URL!);
  }

  // 내 정보 조회 API
  @Get('me')
  @UseGuards(AuthGuard('jwt')) // JWT 토큰이 있는 사람만 통과
  async getProfile(@Req() req: Request) {
    // req.user에는 JwtStrategy에서 리턴한 { userId, kakaoId }가 들어있음
    const userPayload = req.user as { userId: number; kakaoId: string };

    // DB에서 해당 유저 조회
    const user = await this.usersService.findByKakaoId(userPayload.kakaoId);
    return { status: 'success', data: user, message: 'OK' };
  }
}
