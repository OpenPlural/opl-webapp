import { UserInfo } from './User';
import { TokenId } from './Session';

export interface AccountInfo {
  session: SessionData;
  createdAt: string;
  friendCode: string;
  user: UserInfo;
}

export interface SessionData {
  id: TokenId;
  token: string;
}
