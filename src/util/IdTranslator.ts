import { Folder } from '../services/model/Folder';
import { LocalStorageService } from '../services/LocalStorageService';
import { Member } from '../services/model/Member';
import { FrontEntry } from '../services/model/Front';
import { CustomFieldDataValue } from '../services/model/Field';
import { PrivacyBucket } from '../services/model/Privacy';

export type TargetField = 'id' | 'remoteId';
type LocalRemoteIdPair = { id: bigint; remoteId: bigint | null };

export function translateFolder(localStorageService: LocalStorageService, folder: Folder, target: TargetField): Folder {
  folder = Object.assign({}, folder);
  includeRemoteId(folder, target);
  translateFolders(localStorageService, folder, ['parentId'], target);
  return folder;
}

export function translateMember(localStorageService: LocalStorageService, member: Member, target: TargetField): Member {
  const folders = localStorageService.folders();
  const source = getOpposite(target);
  return {
    ...member,
    remoteId: member.id,
    folders: member.folders.map((folderId) => resolve(folders, folderId, source)[target]!),
  };
}

export function translateFrontEntry(localStorageService: LocalStorageService, frontEntry: FrontEntry, target: TargetField): FrontEntry {
  frontEntry = Object.assign({}, frontEntry);
  includeRemoteId(frontEntry, target);
  translateMembers(localStorageService, frontEntry, ['member'], target);
  return frontEntry;
}

export function translateCustomFieldDataValue(localStorageService: LocalStorageService, customFieldDataValue: CustomFieldDataValue, target: TargetField): CustomFieldDataValue {
  customFieldDataValue = Object.assign({}, customFieldDataValue);
  includeRemoteId(customFieldDataValue, target);
  translateCustomFields(localStorageService, customFieldDataValue, ['fieldId'], target);
  translateMembers(localStorageService, customFieldDataValue, ['memberId'], target);
  return customFieldDataValue;
}

export function translatePrivacyBucket(localStorageService: LocalStorageService, privacyBucket: PrivacyBucket, target: TargetField): PrivacyBucket {
  const folders = localStorageService.folders();
  const members = localStorageService.members();
  const source = getOpposite(target);
  return {
    ...privacyBucket,
    folders: privacyBucket.folders.map((folderId) => resolve(folders, folderId, source)[target]!),
    members: privacyBucket.members.map((memberId) => resolve(members, memberId, source)[target]!),
  };
}

function translateFolders(localStorageService: LocalStorageService, obj: any, fieldNames: string[], target: TargetField) {
  translateFields(localStorageService.folders(), obj, fieldNames, target);
}

function translateMembers(localStorageService: LocalStorageService, obj: any, fieldNames: string[], target: TargetField) {
  translateFields(localStorageService.members(), obj, fieldNames, target);
}

function translateCustomFields(localStorageService: LocalStorageService, obj: any, fieldNames: string[], target: TargetField) {
  translateFields(localStorageService.customFields(), obj, fieldNames, target);
}

function translateFields(array: LocalRemoteIdPair[], obj: any, fieldNames: string[], target: TargetField) {
  const source = getOpposite(target);
  for (const fieldName of fieldNames) {
    const id = obj[fieldName] as bigint | null;
    if (id) {
      obj[fieldName] = resolve(array, id, source)[target];
    }
  }
}

function resolve<T extends LocalRemoteIdPair>(array: T[], id: bigint, fieldName: TargetField): T {
  const obj = array.find((item) => item[fieldName] === id);
  if (obj) {
    return obj;
  }
  throw new Error('Resource object not found.');
}

function getOpposite(target: TargetField): TargetField {
  return target === 'id' ? 'remoteId' : 'id';
}

function includeRemoteId(obj: LocalRemoteIdPair, target: TargetField) {
  if (target === 'id') {
    obj.remoteId = obj.id;
  }
}
