import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { MissionsService } from './missions.service';
import { CreateMissionDto } from './dto/create-mission.dto';
import { CompleteMissionDto } from './dto/complete-mission.dto';

@Controller('missions')
export class MissionsController {
  constructor(private readonly missionsService: MissionsService) {}

  // GET /missions
  @Get()
  findAll() {
    return this.missionsService.findAll();
  }

  // GET /missions/:id
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.missionsService.findOne(id);
  }

  // POST /missions
  @Post()
  create(@Body() dto: CreateMissionDto) {
    return this.missionsService.create(dto);
  }

  // POST /missions/complete
  @Post('complete')
  complete(@Body() dto: CompleteMissionDto) {
    return this.missionsService.complete(dto);
  }

  // GET /missions/user/:userId
  @Get('user/:userId')
  findCompletedByUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.missionsService.findCompletedByUser(userId);
  }
}
