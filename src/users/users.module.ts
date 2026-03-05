import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma.service';

@Module({
  providers: [UsersService, PrismaService],
  exports: [UsersService], // auth 모듈에서 UsersService를 사용할 수 있게 export
})
export class UsersModule {}
