import {
  Controller, Get, Patch, Delete,
  Param, Body, Query, ParseIntPipe, DefaultValuePipe, UseGuards,
} from '@nestjs/common';
import { AdminInquiriesService } from './admin-inquiries.service.js';
import { AdminGuard } from '../guards/admin.guard.js';
import { ReplyInquiryDto } from './dto/reply-inquiry.dto.js';

@Controller('admin/inquiries')
@UseGuards(AdminGuard)
export class AdminInquiriesController {
  constructor(private readonly service: AdminInquiriesService) {}

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

  @Patch(':id')
  reply(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReplyInquiryDto,
  ) {
    return this.service.reply(id, dto.answer);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
