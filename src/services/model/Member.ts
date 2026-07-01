import { generateLocalId } from '../../util/IdGenerator';
import { Folder, FolderId } from './Folder';
import { truncateCurrentDate } from '../../util/DateTruncate';

export type MemberId = bigint;

export interface Member {
  id: MemberId;
  remoteId: MemberId | null;
  sort: bigint;
  name: string;
  pronouns: string | null;
  avatar: string | null;
  description: string | null;
  color: bigint;
  archived: boolean;
  custom: boolean;
  createdAt: string;
  updatedAt: string;
  folders: FolderId[];
}

export interface ExtendedMember {
  member: Member;
  folders: Folder[];
}

export function makeMember(name: string, custom: boolean): Member {
  const currentDate = truncateCurrentDate();
  return {
    id: generateLocalId(),
    remoteId: null,
    sort: 0n,
    name,
    pronouns: null,
    avatar: null,
    description: null,
    color: 16777215n,
    archived: false,
    custom,
    createdAt: currentDate,
    updatedAt: currentDate,
    folders: []
  };
}
