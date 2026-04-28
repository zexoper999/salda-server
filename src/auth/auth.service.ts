// 회원가입/로그인 로직
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  // 카카오 유저 검증 (없으면 자동 회원가입)
  async validateKakaoUser(kakaoId: string, name: string) {
    let user = await this.usersService.findByKakaoId(kakaoId);

    if (!user) {
      // 처음 로그인하는 유저 → 자동 회원가입
      user = await this.usersService.createKakaoUser(kakaoId, name);
    }

    return user;
  }

  // JWT 토큰 발급
  generateToken(user: { id: number; kakaoId: string }) {
    const payload = { userId: user.id, kakaoId: user.kakaoId, role: 'USER' };
    return this.jwtService.sign(payload);
  }

  // 어드민 JWT 발급
  generateAdminToken(username: string) {
    const payload = { userId: 0, role: 'ADMIN', username };
    return this.jwtService.sign(payload);
  }
}
