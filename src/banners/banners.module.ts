import { Module } from '@nestjs/common';
import { BannersController } from './banners.controller';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [AdminModule],
  controllers: [BannersController],
})
export class BannersModule {}
