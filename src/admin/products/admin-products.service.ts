import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { ProductStatus } from '../../../generated/prisma/enums.js';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

function fmtCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(n);
}

@Injectable()
export class AdminProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(page: number, limit: number, search?: string) {
    const skip = (page - 1) * limit;
    const where = search ? { name: { contains: search, mode: 'insensitive' as const } } : {};

    const [products, total] = await Promise.all([
      this.prisma.client.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { id: 'desc' },
        include: { _count: { select: { purchases: true } } },
      }),
      this.prisma.client.product.count({ where }),
    ]);

    const items = products.map(({ _count, ...p }) => ({
      ...p,
      purchaseCount: _count.purchases,
      purchaseCountFmt: fmtCount(_count.purchases),
    }));

    return { status: 'success', data: { products: items, total } };
  }

  async findOne(id: number, purchasePage = 1, purchaseLimit = 10, purchaseSearch?: string) {
    const product = await this.prisma.client.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('상품을 찾을 수 없습니다.');

    const purchaseWhere = {
      productId: id,
      ...(purchaseSearch
        ? { user: { name: { contains: purchaseSearch, mode: 'insensitive' as const } } }
        : {}),
    };

    const [purchases, purchaseTotal] = await Promise.all([
      this.prisma.client.purchase.findMany({
        where: purchaseWhere,
        skip: (purchasePage - 1) * purchaseLimit,
        take: purchaseLimit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true } } },
      }),
      this.prisma.client.purchase.count({ where: purchaseWhere }),
    ]);

    return {
      status: 'success',
      data: {
        product,
        purchases,
        purchaseTotal,
        purchaseCountFmt: fmtCount(purchaseTotal),
      },
    };
  }

  async create(dto: CreateProductDto) {
    const product = await this.prisma.client.product.create({
      data: {
        category: dto.category,
        name: dto.name,
        brand: dto.brand,
        description: dto.description,
        imageUrl: dto.imageUrl,
        price: dto.price,
        status: dto.status ?? ProductStatus.ON_SALE,
        startAt: dto.startAt ? new Date(dto.startAt) : null,
        endAt: dto.endAt ? new Date(dto.endAt) : null,
      },
    });
    return { status: 'success', data: product };
  }

  async update(id: number, dto: UpdateProductDto) {
    const product = await this.prisma.client.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('상품을 찾을 수 없습니다.');

    const updated = await this.prisma.client.product.update({
      where: { id },
      data: {
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.brand !== undefined && { brand: dto.brand }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
        ...(dto.price !== undefined && { price: dto.price }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...('startAt' in dto && { startAt: dto.startAt ? new Date(dto.startAt) : null }),
        ...('endAt' in dto && { endAt: dto.endAt ? new Date(dto.endAt) : null }),
      },
    });
    return { status: 'success', data: updated };
  }

  async remove(id: number) {
    const product = await this.prisma.client.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('상품을 찾을 수 없습니다.');
    await this.prisma.client.product.delete({ where: { id } });
    return { status: 'success' };
  }
}
