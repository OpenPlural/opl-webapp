import { MemberId } from './Member';
import { generateLocalId } from '../../util/IdGenerator';
import { truncateCurrentDate } from '../../util/DateTruncate';

export type FrontEntryId = bigint;

export interface FrontEntry {
  id: FrontEntryId;
  remoteId: FrontEntryId | null;
  member: MemberId;
  startedAt: string;
  endedAt: string | null;
  comment: string | null;
  updatedAt: string;
}

export function makeFrontEntry(member: MemberId): FrontEntry {
  const currentDate = truncateCurrentDate();
  return {
    id: generateLocalId(),
    remoteId: null,
    member,
    startedAt: currentDate,
    endedAt: null,
    comment: null,
    updatedAt: currentDate,
  };
}
