import {
  Controller, Get, Post, Delete,
  Param, Body, Query, ParseIntPipe, DefaultValuePipe, UseGuards,
} from '@nestjs/common';
import { AdminNotificationsService } from './admin-notifications.service.js';
import { AdminGuard } from '../guards/admin.guard.js';
import { CreateNotificationDto } from './dto/create-notification.dto.js';

@Controller('admin/notifications')
@UseGuards(AdminGuard)
export class AdminNotificationsController {
  constructor(private readonly service: AdminNotificationsService) {}

  @Get()
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
  ) {
    return this.service.findAll(page, limit, search);
  }

  @Get('users')
  getUsers(@Query('search') search?: string) {
    return this.service.getUsers(search);
  }

  @Post()
  create(@Body() dto: CreateNotificationDto) {
    return this.service.create(dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
