import { MissionCategory, MissionStatus } from '../../../../generated/prisma/enums.js';

export class UpdateMissionDto {
  category?: MissionCategory;
  title?: string;
  publisher?: string;
  oneLineDesc?: string;
  description?: string;
  imageUrls?: string[];
  missionUrl?: string;
  rewardPoint?: number;
  rewardTicket?: number;
  ageRestriction?: boolean;
  isFirstCome?: boolean;
  limitCount?: number | null;
  startAt?: string | null;
  endAt?: string | null;
  status?: MissionStatus;
}
