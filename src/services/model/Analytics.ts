import { MemberId } from './Member';

export interface Analytics {
  members: AnalyticsMember[];
}

export interface AnalyticsMember {
  id: MemberId;
  frontCount: bigint;
  frontMinutes: bigint;
}
