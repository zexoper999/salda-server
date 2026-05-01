import { MissionCategory, MissionStatus } from '../../../../generated/prisma/enums.js';

export class CreateMissionDto {
  category: MissionCategory;
  title: string;
  publisher?: string;
  oneLineDesc?: string;
  description?: string;
  imageUrls?: string[];
  missionUrl?: string;
  rewardPoint?: number;
  rewardTicket?: number;
  ageRestriction?: boolean;
  isFirstCome?: boolean;
  limitCount?: number;
  startAt?: string;
  endAt?: string;
  status?: MissionStatus;
}
