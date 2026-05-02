import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { MissionsModule } from './missions/missions.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { ProductsModule } from './products/products.module';
import { AdminModule } from './admin/admin.module';
import { BannersModule } from './banners/banners.module';
import { UploadModule } from './upload/upload.module';
import { NoticesModule } from './notices/notices.module';
import { InquiriesModule } from './inquiries/inquiries.module';
import { FaqModule } from './faq/faq.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    UsersModule,
    AuthModule,
    MissionsModule,
    SubscriptionsModule,
    ProductsModule,
    AdminModule,
    BannersModule,
    UploadModule,
    NoticesModule,
    InquiriesModule,
    FaqModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
  exports: [PrismaService],
})
export class AppModule {}
