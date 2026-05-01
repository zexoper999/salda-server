import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, ParseIntPipe, DefaultValuePipe, UseGuards,
} from '@nestjs/common';
import { AdminMissionsService } from './admin-missions.service';
import { AdminGuard } from '../guards/admin.guard';
import { CreateMissionDto } from './dto/create-mission.dto';
import { UpdateMissionDto } from './dto/update-mission.dto';

@Controller('admin/missions')
@UseGuards(AdminGuard)
export class AdminMissionsController {
  constructor(private readonly service: AdminMissionsService) {}

  @Get()
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
  ) {
    return this.service.findAll(page, limit, search);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('participantPage', new DefaultValuePipe(1), ParseIntPipe) participantPage: number,
    @Query('participantLimit', new DefaultValuePipe(10), ParseIntPipe) participantLimit: number,
    @Query('search') search?: string,
  ) {
    return this.service.findOne(id, participantPage, participantLimit, search);
  }

  @Post()
  create(@Body() dto: CreateMissionDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMissionDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
