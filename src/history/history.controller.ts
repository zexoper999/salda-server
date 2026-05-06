import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { HistoryService } from './history.service';

@Controller('history')
@UseGuards(AuthGuard('jwt'))
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Get('my')
  findMy(@Request() req: { user: { userId: number } }) {
    return this.historyService.findMyHistory(req.user.userId);
  }
}
