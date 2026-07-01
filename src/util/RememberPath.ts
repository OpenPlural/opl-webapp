import {FolderId} from '../services/model/Folder';
import {UserId} from '../services/model/User';

let rememberedPath: RememberedPath = {
  friendId: null,
  folderId: null,
};

export function rememberLocalPath(folderId: FolderId) {
  rememberedPath = {
    friendId: null,
    folderId,
  };
}

export function rememberFriendPath(friendId: UserId, folderId: FolderId) {
  rememberedPath = {
    friendId,
    folderId,
  };
}

export function getRememberedLocalPath(): FolderId | null {
  if (rememberedPath.friendId === null) {
    return rememberedPath.folderId
  }
  return null;
}

export function getRememberedFriendPath(friendId: UserId): FolderId | null {
  if (rememberedPath.friendId === friendId) {
    return rememberedPath.folderId;
  }
  return null;
}

export function forgetRememberedPath() {
  rememberedPath = {
    friendId: null,
    folderId: null,
  };
}

interface RememberedPath {
  friendId: UserId | null;
  folderId: FolderId | null;
}
