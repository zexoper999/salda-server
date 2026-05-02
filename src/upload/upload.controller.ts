import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { R2Service } from './r2.service.js';
import { AdminGuard } from '../admin/guards/admin.guard.js';
import { IsString } from 'class-validator';

class AdminPresignedDto {
  @IsString() folder: string;
  @IsString() contentType: string;
}

class UserPresignedDto {
  @IsString() folder: string;
  @IsString() fileName: string;
  @IsString() contentType: string;
}

@Controller()
export class UploadController {
  constructor(private readonly r2: R2Service) {}

  /** 어드민 전용 presigned URL */
  @Post('admin/upload/presigned')
  @UseGuards(AdminGuard)
  adminPresigned(@Body() body: AdminPresignedDto) {
    const folder = body.folder ?? 'misc';
    const contentType = body.contentType ?? 'image/jpeg';
    return this.r2.getPresignedUrl(folder, contentType);
  }

  /** 유저 전용 presigned URL */
  @Post('upload/presigned')
  @UseGuards(AuthGuard('jwt'))
  userPresigned(@Body() body: UserPresignedDto) {
    const folder = body.folder ?? 'misc';
    const contentType = body.contentType ?? 'image/jpeg';
    return this.r2.getPresignedUrl(folder, contentType);
  }
}
