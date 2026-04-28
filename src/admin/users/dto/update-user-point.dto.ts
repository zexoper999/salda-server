import { IsInt, Min } from 'class-validator';

export class UpdateUserPointDto {
  @IsInt()
  @Min(0)
  point: number;
}
