import { Module } from '@nestjs/common';
import { AdminAuthController } from './auth/admin-auth.controller';
import { AdminAuthService } from './auth/admin-auth.service';
import { AdminBannersController } from './banners/admin-banners.controller';
import { AdminBannersService } from './banners/admin-banners.service';
import { AuthModule } from '../auth/auth.module';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [AuthModule],
  controllers: [AdminAuthController, AdminBannersController],
  providers: [AdminAuthService, AdminBannersService, PrismaService],
  exports: [AdminBannersService],
})
export class AdminModule {}
