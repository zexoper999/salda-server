import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, ParseIntPipe, DefaultValuePipe, UseGuards,
} from '@nestjs/common';
import { AdminProductsService } from './admin-products.service';
import { AdminGuard } from '../guards/admin.guard';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller('admin/products')
@UseGuards(AdminGuard)
export class AdminProductsController {
  constructor(private readonly service: AdminProductsService) {}

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
    @Query('purchasePage', new DefaultValuePipe(1), ParseIntPipe) purchasePage: number,
    @Query('purchaseLimit', new DefaultValuePipe(10), ParseIntPipe) purchaseLimit: number,
    @Query('purchaseSearch') purchaseSearch?: string,
  ) {
    return this.service.findOne(id, purchasePage, purchaseLimit, purchaseSearch);
  }

  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProductDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
