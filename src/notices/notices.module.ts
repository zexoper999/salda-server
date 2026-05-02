import { Module } from '@nestjs/common';
import { NoticesController } from './notices.controller.js';
import { NoticesService } from './notices.service.js';
import { PrismaService } from '../prisma.service.js';

@Module({
  controllers: [NoticesController],
  providers: [NoticesService, PrismaService],
})
export class NoticesModule {}
