import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ProductCategory } from '../../generated/prisma/enums.js';
import { PurchaseProductDto } from './dto/purchase-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  // 상품 목록 — ON_SALE 상태만, 카테고리 필터
  async findAll(category: ProductCategory | undefined) {
    const now = new Date();

    const products = await this.prisma.client.product.findMany({
      where: {
        status: 'ON_SALE',
        ...(category ? { category } : {}),
        OR: [{ startAt: null }, { startAt: { lte: now } }],
        AND: [{ OR: [{ endAt: null }, { endAt: { gte: now } }] }],
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        category: true,
        name: true,
        imageUrl: true,
        price: true,
        stock: true,
        _count: { select: { purchases: true } },
      },
    });

    const items = products.map(({ _count, ...product }) => ({
      ...product,
      purchaseCount: _count.purchases,
      isSoldOut: product.stock !== null && product.stock <= 0,
    }));

    return {
      status: 'success',
      data: { total: items.length, products: items },
    };
  }

  // 상품 상세
  async findOne(id: number) {
    const now = new Date();

    const product = await this.prisma.client.product.findUnique({
      where: { id },
      include: { _count: { select: { purchases: true } } },
    });

    if (!product) throw new NotFoundException('상품을 찾을 수 없습니다.');

    // 판매 기간 체크
    if (product.startAt && now < product.startAt) {
      throw new BadRequestException('아직 판매 시작 전인 상품입니다.');
    }
    if (product.endAt && now > product.endAt) {
      throw new BadRequestException('판매가 종료된 상품입니다.');
    }
    if (product.status !== 'ON_SALE') {
      throw new BadRequestException('현재 판매 중이 아닌 상품입니다.');
    }

    const { _count, ...rest } = product;
    return {
      status: 'success',
      data: {
        ...rest,
        purchaseCount: _count.purchases,
        isSoldOut: product.stock !== null && product.stock <= 0,
      },
    };
  }

  // 구매 — 포인트 차감 트랜잭션
  async purchase(productId: number, userId: number, dto: PurchaseProductDto) {
    const now = new Date();

    const product = await this.prisma.client.product.findUnique({
      where: { id: productId },
    });
    if (!product) throw new NotFoundException('상품을 찾을 수 없습니다.');

    // 판매 기간 체크
    if (product.startAt && now < product.startAt) {
      throw new BadRequestException('아직 판매 시작 전인 상품입니다.');
    }
    if (product.endAt && now > product.endAt) {
      throw new BadRequestException('판매가 종료된 상품입니다.');
    }
    if (product.status !== 'ON_SALE') {
      throw new BadRequestException('현재 판매 중이 아닌 상품입니다.');
    }

    // 재고 체크
    if (product.stock !== null && product.stock <= 0) {
      throw new BadRequestException('품절된 상품입니다.');
    }

    return this.prisma.client.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');

      if (user.point < product.price) {
        throw new BadRequestException(
          `포인트가 부족합니다. 보유: ${user.point}P, 필요: ${product.price}P`,
        );
      }

      // 포인트 차감
      const updated = await tx.user.update({
        where: { id: userId },
        data: { point: { decrement: product.price } },
      });

      // 재고 차감 (stock이 null이면 무제한)
      if (product.stock !== null) {
        await tx.product.update({
          where: { id: productId },
          data: { stock: { decrement: 1 } },
        });
      }

      // 구매 내역 생성
      const purchase = await tx.purchase.create({
        data: {
          userId,
          productId,
          phone: dto.phone,
          pointBefore: user.point,
          pointUsed: product.price,
          pointAfter: updated.point,
        },
      });

      return {
        status: 'success',
        data: {
          purchaseId: purchase.id,
          pointUsed: product.price,
          pointAfter: updated.point,
        },
        message: '구매가 완료되었습니다. 기프티콘을 발송해 드립니다.',
      };
    });
  }

  // 내 구매 내역
  async findMyPurchases(userId: number) {
    const purchases = await this.prisma.client.purchase.findMany({
      where: { userId },
      include: {
        product: {
          select: { id: true, category: true, name: true, imageUrl: true, price: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { status: 'success', data: purchases };
  }
}
