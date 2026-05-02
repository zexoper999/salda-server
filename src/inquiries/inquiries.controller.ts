import { Controller, Get, Post, Param, Body, Request, ParseIntPipe, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InquiriesService } from './inquiries.service.js';
import { CreateInquiryDto } from './dto/create-inquiry.dto.js';

@Controller('inquiries')
@UseGuards(AuthGuard('jwt'))
export class InquiriesController {
  constructor(private readonly service: InquiriesService) {}

  @Get('my')
  findMy(@Request() req: { user: { userId: number } }) {
    return this.service.findMy(req.user.userId);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: { userId: number } },
  ) {
    return this.service.findOne(id, req.user.userId);
  }

  @Post()
  create(
    @Body() dto: CreateInquiryDto,
    @Request() req: { user: { userId: number } },
  ) {
    return this.service.create(req.user.userId, dto);
  }
}
