import { UserInfo } from './User';
import { SessionId } from './Session';

export interface AccountInfo {
  session: SessionData;
  createdAt: string;
  friendCode: string;
  user: UserInfo;
}

export interface SessionData {
  id: SessionId;
  token: string;
}
