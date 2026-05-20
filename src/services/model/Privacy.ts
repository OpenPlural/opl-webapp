import { FolderId } from './Folder';
import { MemberId } from './Member';
import { UserId } from './User';

export type PrivacyBucketId = bigint;

export interface PrivacyBucket {
  id: PrivacyBucketId;
  sort: bigint;
  name: string;
  description: string | null;
  emoji: string | null;
  color: bigint;
  folders: FolderId[];
  members: MemberId[];
  friends: UserId[];
}

export interface SimplePrivacyBucket {
  id: PrivacyBucketId;
  sort: bigint;
  name: string;
  emoji: string | null;
  color: bigint;
}

export function makePrivacyBucket(name: string, sort: bigint): PrivacyBucket {
  return {
    id: 0n,
    sort,
    name,
    description: null,
    emoji: null,
    color: 16777215n,
    folders: [],
    members: [],
    friends: []
  };
}
