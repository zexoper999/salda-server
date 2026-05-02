import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { NoticesService } from './notices.service.js';

@Controller('notices')
export class NoticesController {
  constructor(private readonly service: NoticesService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }
}
