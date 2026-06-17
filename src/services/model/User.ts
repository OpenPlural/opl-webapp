import { Folder } from './Folder';
import { Member } from './Member';
import { FrontEntry } from './Front';

export type UserId = bigint;

export interface UserInfo {
  id: UserId;
  name: string;
  email: string | null;
  avatar: string | null;
  description: string | null;
  color: bigint;
  system: boolean;
}

export interface ExtendedUserInfo {
  user: UserInfo;
  folders: Folder[] | undefined;
  members: Member[] | undefined;
  front: FrontEntry[] | undefined;
}
