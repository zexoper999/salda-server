import { Controller, Get } from '@nestjs/common';
import { AdminBannersService } from '../admin/banners/admin-banners.service';

@Controller('banners')
export class BannersController {
  constructor(private readonly bannersService: AdminBannersService) {}

  @Get()
  findActive() {
    return this.bannersService.findActive();
  }
}
