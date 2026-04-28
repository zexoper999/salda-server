import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AdminBannersService } from './admin-banners.service';
import { AdminGuard } from '../guards/admin.guard';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';

@Controller('admin/banners')
@UseGuards(AdminGuard)
export class AdminBannersController {
  constructor(private readonly adminBannersService: AdminBannersService) {}

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminBannersService.findAll(search, Number(page) || 1, Number(limit) || 20);
  }

  @Post()
  create(@Body() dto: CreateBannerDto) {
    return this.adminBannersService.create(dto);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.adminBannersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBannerDto) {
    return this.adminBannersService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.adminBannersService.remove(id);
  }
}
