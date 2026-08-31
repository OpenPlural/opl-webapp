import { UserInfo } from './User';
import { Folder, FolderId } from './Folder';
import { Member, MemberId } from './Member';
import { FrontEntry } from './Front';
import { CustomField, CustomFieldDataId, CustomFieldDataValue, CustomFieldId } from './Field';
import { Poll, PollAnswer, PollAnswerId, PollId } from './Poll';

export interface SyncData {
  time: string;
  user: UserInfo;
  friendCode: string;
  deletionDelta: boolean;
  folderIds: FolderId[];
  memberIds: MemberId[];
  fieldIds: CustomFieldId[];
  fieldValueIds: CustomFieldDataId[];
  pollIds: PollId[];
  pollAnswerIds: PollAnswerId[];
  updatedFolders: Folder[];
  updatedMembers: Member[];
  updatedFields: CustomField[];
  updatedFieldValues: CustomFieldDataValue[];
  updatedPolls: Poll[];
  updatedPollAnswers: PollAnswer[];
  front: FrontEntry[];
}
