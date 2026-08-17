import { UserInfo } from './User';
import { SessionId } from './Session';

export interface AccountInfo {
  session: SessionId | null;
  createdAt: string;
  friendCode: string;
  user: UserInfo;
}
