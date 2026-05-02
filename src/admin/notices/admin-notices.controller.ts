import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, ParseIntPipe, DefaultValuePipe, UseGuards,
} from '@nestjs/common';
import { AdminNoticesService } from './admin-notices.service.js';
import { AdminGuard } from '../guards/admin.guard.js';
import { CreateNoticeDto } from './dto/create-notice.dto.js';
import { UpdateNoticeDto } from './dto/update-notice.dto.js';

@Controller('admin/notices')
@UseGuards(AdminGuard)
export class AdminNoticesController {
  constructor(private readonly service: AdminNoticesService) {}

  @Get()
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
  ) {
    return this.service.findAll(page, limit, search);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateNoticeDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateNoticeDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
