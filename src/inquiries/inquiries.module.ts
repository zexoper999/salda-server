import { Module } from '@nestjs/common';
import { InquiriesController } from './inquiries.controller.js';
import { InquiriesService } from './inquiries.service.js';
import { PrismaService } from '../prisma.service.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [InquiriesController],
  providers: [InquiriesService, PrismaService],
})
export class InquiriesModule {}
