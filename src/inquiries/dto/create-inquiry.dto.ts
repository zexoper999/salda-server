import { IsString, IsOptional } from 'class-validator';

export class CreateInquiryDto {
  @IsString() title: string;
  @IsString() content: string;
  @IsOptional() @IsString() imageUrl?: string;
}
