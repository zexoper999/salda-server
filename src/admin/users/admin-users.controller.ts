import { Controller, Get, Patch, Delete, Param, Body, Query, ParseIntPipe, UseGuards, DefaultValuePipe } from '@nestjs/common';
import { AdminUsersService } from './admin-users.service';
import { AdminGuard } from '../guards/admin.guard';
import { UpdateUserPointDto } from './dto/update-user-point.dto';

@Controller('admin/users')
@UseGuards(AdminGuard)
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search?: string,
  ) {
    return this.adminUsersService.findAll(page, limit, search);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.adminUsersService.findOne(id);
  }

  @Patch(':id/point')
  updatePoint(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserPointDto,
  ) {
    return this.adminUsersService.updatePoint(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.adminUsersService.remove(id);
  }
}
