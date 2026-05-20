import { UserInfo } from './User';

export interface Friend {
  user: UserInfo;
  frontText: string;
}

export interface FriendRequest {
  code: string;
  name: string;
  system: boolean;
}

export interface FriendSettings {
  permissionLevel: bigint;
  notifyMe: boolean;
}
