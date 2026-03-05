// DB에서 유저 조회/생성
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // 카카오 ID로 유저 조회
  async findByKakaoId(kakaoId: string) {
    return this.prisma.client.user.findUnique({
      where: { kakaoId },
    });
  }

  // 신규 유저 생성 (최초 카카오 로그인 시 자동 회원가입)
  async createKakaoUser(kakaoId: string, name: string) {
    return this.prisma.client.user.create({
      data: { kakaoId, name },
    });
  }
}
