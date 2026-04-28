import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class AdminGuard extends AuthGuard('jwt') {
  handleRequest<T>(err: unknown, user: T & { role?: string }): T {
    if (err || !user || user.role !== 'ADMIN') {
      throw new UnauthorizedException('어드민 권한이 없습니다.');
    }
    return user;
  }
}
