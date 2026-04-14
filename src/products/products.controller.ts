import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProductsService } from './products.service';
import { PurchaseProductDto } from './dto/purchase-product.dto';
import { ProductCategory } from '../../generated/prisma/enums.js';
import type { Request } from 'express';

interface JwtPayload {
  userId: number;
  kakaoId: string;
}

@Controller('products')
@UseGuards(AuthGuard('jwt'))
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // GET /products?category=CAFE — 상품 목록 (ON_SALE, 카테고리 필터)
  // 주의: /my/purchases 보다 먼저 선언
  @Get('my/purchases')
  findMyPurchases(@Req() req: Request) {
    const { userId } = req.user as JwtPayload;
    return this.productsService.findMyPurchases(userId);
  }

  @Get()
  findAll(@Query('category') category?: ProductCategory) {
    return this.productsService.findAll(category);
  }

  // GET /products/:id — 상품 상세
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }

  // POST /products/:id/purchase — 구매
  @Post(':id/purchase')
  purchase(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
    @Body() dto: PurchaseProductDto,
  ) {
    const { userId } = req.user as JwtPayload;
    return this.productsService.purchase(id, userId, dto);
  }
}
