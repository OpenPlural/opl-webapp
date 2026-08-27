import { MemberId } from './Member';
import { generateLocalId } from '../../util/IdGenerator';
import { truncateCurrentDate, truncateDate } from '../../util/DateTruncate';

export type PollId = bigint;
export type PollAnswerId = bigint;

export interface Poll {
  id: PollId;
  remoteId: PollId | null;
  name: string;
  description: string | null;
  allowAbstain: boolean;
  allowVeto: boolean;
  openUntil: string;
  updatedAt: string;
  customOptions: string[] | null;
}

export interface PollAnswer {
  id: PollAnswerId;
  remoteId: PollAnswerId | null;
  pollId: PollId;
  memberId: MemberId;
  answer: bigint;
  comment: string | null;
  updatedAt: string;
}

export function makePoll(name: string, allowAbstain: boolean, allowVeto: boolean, customOptions: string[] | null): Poll {
  return {
    id: generateLocalId(),
    remoteId: null,
    name,
    description: null,
    allowAbstain,
    allowVeto,
    openUntil: truncateDate(new Date(Date.now() + 1209600000)), // 14 days from now
    updatedAt: truncateCurrentDate(),
    customOptions,
  };
}

export function makePollAnswer(pollId: PollId, memberId: MemberId, answer: bigint, comment: string | null): PollAnswer {
  return {
    id: generateLocalId(),
    remoteId: null,
    pollId,
    memberId,
    answer,
    comment,
    updatedAt: truncateCurrentDate(),
  }
}
