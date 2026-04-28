import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';

// JWT 토큰 검증
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    /* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request): string | null =>
          (req?.cookies?.adminToken as string | undefined) ??
          (req?.cookies?.accessToken as string | undefined) ??
          null,
      ]),
      secretOrKey: process.env.JWT_SECRET!,
    });
    /* eslint-enable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
  }

  // JWT 검증 성공 시 req.user에 담길 데이터
  validate(payload: { userId: number; kakaoId?: string; role?: string; username?: string }) {
    return {
      userId: payload.userId,
      kakaoId: payload.kakaoId ?? '',
      role: payload.role ?? 'USER',
      username: payload.username,
    };
  }
}
