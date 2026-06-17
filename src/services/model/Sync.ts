import { UserInfo } from './User';
import { Folder, FolderId } from './Folder';
import { Member, MemberId } from './Member';
import { FrontEntry } from './Front';
import { CustomField, CustomFieldDataId, CustomFieldDataValue, CustomFieldId } from './Field';

export interface SyncData {
  time: string;
  user: UserInfo;
  friendCode: string;
  deletionDelta: boolean;
  folderIds: FolderId[];
  memberIds: MemberId[];
  fieldIds: CustomFieldId[];
  fieldValueIds: CustomFieldDataId[];
  updatedFolders: Folder[];
  updatedMembers: Member[];
  updatedFields: CustomField[];
  updatedFieldValues: CustomFieldDataValue[];
  front: FrontEntry[];
}
