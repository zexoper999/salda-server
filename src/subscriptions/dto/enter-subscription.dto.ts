import { IsInt, Min } from 'class-validator';

export class EnterSubscriptionDto {
  @IsInt()
  @Min(1)
  ticketCount: number; // 이번 응모에 사용할 응모권 수
}
