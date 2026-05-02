import { Controller, Get } from '@nestjs/common';
import { FaqService } from './faq.service.js';

@Controller('faq')
export class FaqController {
  constructor(private readonly service: FaqService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }
}
