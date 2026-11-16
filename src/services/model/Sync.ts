import { UserInfo } from './User';
import { Folder, FolderId } from './Folder';
import { Member, MemberId } from './Member';
import { FrontEntry, FrontEntryId } from './Front';
import { CustomField, CustomFieldDataId, CustomFieldDataValue, CustomFieldId } from './Field';
import { Poll, PollAnswer, PollAnswerId, PollId } from './Poll';
import { PhotoAlbum, PhotoAlbumId } from './Gallery';

export interface SyncRequest {
  time: string;
  known: SyncIds;
  deleted: SyncIds | undefined;
  updated: SyncUpdates | undefined;
  front: FrontEntry[];
}

export interface SyncResponse {
  time: string;
  user: UserInfo;
  friendCode: string;
  delete: SyncIds | undefined;
  assign: SyncIds | undefined;
  update: SyncUpdates | undefined;
  assignFront: FrontEntryId[];
  front: FrontEntry[];
}

export interface SyncIds {
  folders: FolderId[];
  members: MemberId[];
  fields: CustomFieldId[];
  fieldValues: CustomFieldDataId[];
  polls: PollId[];
  pollAnswers: PollAnswerId[];
  photoAlbums: PhotoAlbumId[];
}

export interface SyncUpdates {
  folders: Folder[];
  members: Member[];
  fields: CustomField[];
  fieldValues: CustomFieldDataValue[];
  polls: Poll[];
  pollAnswers: PollAnswer[];
  photoAlbums: PhotoAlbum[];
}

export interface FrontSyncRequest {
  front: FrontEntry[];
}

export interface FrontSyncResponse {
  assignFront: FrontEntryId[];
  front: FrontEntry[];
}
