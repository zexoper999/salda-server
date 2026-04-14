import { IsString, Matches } from 'class-validator';

export class PurchaseProductDto {
  @IsString()
  @Matches(/^01[0-9]{8,9}$/, { message: '올바른 휴대폰 번호 형식이 아닙니다.' })
  phone: string; // 기프티콘 수령 휴대폰 번호
}
