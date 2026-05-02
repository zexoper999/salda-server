import { Module } from '@nestjs/common';
import { AdminAuthController } from './auth/admin-auth.controller';
import { AdminAuthService } from './auth/admin-auth.service';
import { AdminBannersController } from './banners/admin-banners.controller';
import { AdminBannersService } from './banners/admin-banners.service';
import { AdminUsersController } from './users/admin-users.controller';
import { AdminUsersService } from './users/admin-users.service';
import { AdminSubscriptionsController } from './subscriptions/admin-subscriptions.controller';
import { AdminSubscriptionsService } from './subscriptions/admin-subscriptions.service';
import { AdminProductsController } from './products/admin-products.controller';
import { AdminProductsService } from './products/admin-products.service';
import { AdminMissionsController } from './missions/admin-missions.controller';
import { AdminMissionsService } from './missions/admin-missions.service';
import { AdminNoticesController } from './notices/admin-notices.controller';
import { AdminNoticesService } from './notices/admin-notices.service';
import { AuthModule } from '../auth/auth.module';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [AuthModule],
  controllers: [
    AdminAuthController,
    AdminBannersController,
    AdminUsersController,
    AdminSubscriptionsController,
    AdminProductsController,
    AdminMissionsController,
    AdminNoticesController,
  ],
  providers: [
    AdminAuthService,
    AdminBannersService,
    AdminUsersService,
    AdminSubscriptionsService,
    AdminProductsService,
    AdminMissionsService,
    AdminNoticesService,
    PrismaService,
  ],
  exports: [AdminBannersService],
})
export class AdminModule {}
