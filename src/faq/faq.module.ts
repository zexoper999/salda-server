import { Module } from '@nestjs/common';
import { FaqController } from './faq.controller.js';
import { FaqService } from './faq.service.js';
import { PrismaService } from '../prisma.service.js';

@Module({
  controllers: [FaqController],
  providers: [FaqService, PrismaService],
})
export class FaqModule {}
