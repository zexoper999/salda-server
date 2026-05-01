import { IsString, IsOptional, IsInt, IsEnum, IsDateString, Min } from 'class-validator';
import { ProductCategory, ProductStatus } from '../../../../generated/prisma/enums.js';

export class CreateProductDto {
  @IsEnum(ProductCategory)
  category: ProductCategory;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsInt()
  @Min(0)
  price: number;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional()
  @IsDateString()
  startAt?: string;

  @IsOptional()
  @IsDateString()
  endAt?: string;
}
