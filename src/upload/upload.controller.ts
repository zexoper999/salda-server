import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { R2Service } from './r2.service';
import { AdminGuard } from '../admin/guards/admin.guard';

@Controller('admin/upload')
@UseGuards(AdminGuard)
export class UploadController {
  constructor(private readonly r2: R2Service) {}

  @Post('presigned')
  getPresignedUrl(@Body() body: { folder: string; contentType: string }) {
    const folder = body.folder ?? 'misc';
    const contentType = body.contentType ?? 'image/jpeg';
    return this.r2.getPresignedUrl(folder, contentType);
  }
}
