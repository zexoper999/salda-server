import { IsString } from 'class-validator';

export class ReplyInquiryDto {
  @IsString() answer: string;
}
