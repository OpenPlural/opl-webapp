import {inject, Injectable} from '@angular/core';
import {truncateCurrentDate} from '../util/DateTruncate';
import {nullableField} from '../util/NullString';
import {toColorInt} from '../util/ColorConvert';
import {WebService} from './WebService';
import {PrivacyBucket, PrivacyBucketId} from './model/Privacy';
import {CUSTOM_FIELD_DATA_TYPE_DATETIME, CUSTOM_FIELD_DATA_TYPE_TEXT, CustomField} from './model/Field';
import {Folder} from './model/Folder';
import {Member} from './model/Member';

@Injectable({ providedIn: 'root' })
export class SPImportService {
  private readonly webService = inject(WebService);

  async importFromSimplyPlural(input: string, flags: ImportFlags) {
    const obj = JSON.parse(input);

    let privacyMap;
    if (flags.privacyBuckets) {
      privacyMap = await this.importPrivacyBuckets(obj.privacyBuckets);
    } else {
      privacyMap = new Map<string, PrivacyBucketId>();
    }

    let customFieldMap;
    if (flags.customFields) {
      customFieldMap = await this.importCustomFields(obj.customFields, privacyMap, flags);
    } else {
      customFieldMap = new Map<string, CustomField>();
    }

    let folderMap;
    if (flags.folders) {
      folderMap = await this.importFolders(obj.groups, privacyMap, flags);
    } else {
      folderMap = new Map<string, Folder>();
    }

    if (flags.members) {
      await this.importMembers(obj.members, obj.groups, folderMap, customFieldMap, privacyMap, flags);
    }

    if (flags.customFront) {
      await this.importCustomFront(obj.frontStatuses, privacyMap, flags);
    }
  }

  private async importPrivacyBuckets(privacyBuckets: any[]): Promise<Map<string, PrivacyBucketId>> {
    const privacyMap = new Map<string, PrivacyBucketId>();
    const newBuckets: (PrivacyBucket & {spid: string})[] = [];
    for (const bucket of privacyBuckets) {
      newBuckets.push({
        id: 0n,
        sort: bucket.rank,
        name: bucket.name,
        description: nullableField(bucket.desc),
        emoji: nullableField(bucket.icon),
        color: toColorInt(bucket.color),
        folders: [],
        members: [],
        friends: [],
        spid: bucket._id,
      });
    }
    newBuckets.sort((a, b) => a.sort.toString().localeCompare(b.sort.toString()));
    const promises = [];
    for (let i = 0; i < newBuckets.length; i++) {
      promises.push(this.webService.createPrivacyBucket({
        ...newBuckets[i],
        sort: BigInt(i)
      }).then(id => privacyMap.set(newBuckets[i].spid, id)));
    }
    await Promise.all(promises);
    return privacyMap;
  }

  private async importCustomFields(customFields: any[], privacyMap: Map<string, PrivacyBucketId>, flags: ImportFlags): Promise<Map<string, CustomField>> {
    const currentDate = truncateCurrentDate();
    const newFields: (CustomField & {spid: string, spb: string[]})[] = [];
    for (const customField of customFields) {
      let dataType;
      if (customField.type === 6 || customField.type === 6n) {
        dataType = CUSTOM_FIELD_DATA_TYPE_DATETIME;
      } else {
        dataType = CUSTOM_FIELD_DATA_TYPE_TEXT;
      }
      newFields.push({
        id: 0n,
        remoteId: null,
        sort: customField.order,
        name: customField.name,
        dataType,
        updatedAt: currentDate,
        spid: customField._id,
        spb: customField.buckets,
      });
    }
    newFields.sort((a, b) => a.sort.toString().localeCompare(b.sort.toString()));
    const fieldMap = new Map<string, CustomField & {spid: string, spb: string[]}>();
    const promises = [];
    for (let i = 0; i < newFields.length; i++) {
      const field = {
        ...newFields[i],
        sort: BigInt(i)
      };
      promises.push(this.webService.createCustomField(field).then(id => fieldMap.set(field.spid, {
        ...field,
        id
      })));
    }
    await Promise.all(promises);
    if (flags.privacyBuckets) {
      const promises = [];
      for (const field of fieldMap.values()) {
        const buckets = field.spb.map(id => privacyMap.get(id))
          .filter(id => id != undefined);
        for (const bucket of buckets) {
          promises.push(this.webService.addPrivacyBucketCustomField(bucket, {
            ...field,
            remoteId: field.id
          }));
        }
      }
    }
    return fieldMap;
  }

  private async importFolders(groups: any[], privacyMap: Map<string, PrivacyBucketId>, flags: ImportFlags): Promise<Map<string, Folder>> {
    const currentDate = truncateCurrentDate();
    const folderMap = new Map<string, Folder>()
    {
      const promises = [];
      for (const group of groups) {
        const folder = {
          id: 0n,
          remoteId: null,
          parentId: null,
          name: group.name,
          description: nullableField(group.desc),
          emoji: nullableField(group.emoji),
          color: toColorInt(group.color),
          createdAt: currentDate,
          updatedAt: currentDate,
        };
        promises.push(this.webService.createFolderRaw(folder).then(id => folderMap.set(group._id, {
          ...folder,
          id
        })));
      }
      await Promise.all(promises);
    }
    {
      const promises = [];
      for (const group of groups) {
        const folder = folderMap.get(group._id)!;
        const parentId = folderMap.get(group.parent)?.id || null;
        promises.push(this.webService.updateFolderRaw({
          ...folder,
          parentId
        }));
      }
    }
    if (flags.privacyBuckets) {
      const promises = [];
      for (const group of groups) {
        const folder = folderMap.get(group._id)!;
        const buckets = group.buckets.map((id: string) => privacyMap.get(id))
          .filter((id: bigint | undefined) => id != undefined);
        for (const bucket of buckets) {
          promises.push(this.webService.addPrivacyBucketFolder(bucket, {
            ...folder,
            remoteId: folder.id
          }));
        }
      }
      await Promise.all(promises);
    }
    return folderMap;
  }

  private async importMembers(members: any[],
                              groups: any[],
                              folderMap: Map<string, Folder>,
                              customFieldMap: Map<string, CustomField>,
                              privacyMap: Map<string, PrivacyBucketId>,
                              flags: ImportFlags): Promise<void> {
    const currentDate = truncateCurrentDate();
    const memberMap = new Map<string, Member>()
    {
      const promises = [];
      for (const member of members) {
        const memberObj = {
          id: 0n,
          remoteId: null,
          name: member.name,
          pronouns: nullableField(member.pronouns),
          avatar: nullableField(member.avatarUrl),
          description: nullableField(member.desc),
          color: toColorInt(member.color),
          archived: member.archived,
          custom: false,
          createdAt: currentDate,
          updatedAt: currentDate,
          folders: [],
        };
        promises.push(this.webService.createMemberRaw(memberObj).then(id => memberMap.set(member._id, {
          ...memberObj,
          id
        })));
      }
      await Promise.all(promises);
    }
    if (flags.folders) {
      for (const member of members) {
        const folders = groups.filter((group: any) => group.members.includes(member._id))
            .map((group: any) => folderMap.get(group._id)?.id)
            .filter((id: bigint | undefined) => id != undefined);
        const memberObj = memberMap.get(member._id)!;
        await this.webService.updateMemberFoldersRaw(memberObj.id, folders);
      }
    }
    if (flags.customFields) {
      const promises = [];
      for (const member of members) {
        const memberObj = memberMap.get(member._id)!;
        const info = member.info;
        if (info) {
          for (const fieldId of Object.keys(info)) {
            const field = customFieldMap.get(fieldId);
            if (field) {
              const value = info[fieldId].trim();
              if (value.length > 0) {
                promises.push(this.webService.createCustomFieldValueRaw({
                  id: 0n,
                  remoteId: null,
                  fieldId: field.id,
                  memberId: memberObj.id,
                  value,
                  updatedAt: currentDate,
                }));
              }
            }
          }
        }
      }
      await Promise.all(promises);
    }
    if (flags.privacyBuckets) {
      const promises = [];
      for (const member of members) {
        const memberObj = memberMap.get(member._id)!;
        const buckets = member.buckets.map((id: string) => privacyMap.get(id))
          .filter((id: bigint | undefined) => id != undefined);
        for (const bucket of buckets) {
          promises.push(this.webService.addPrivacyBucketMember(bucket, {
            ...memberObj,
            remoteId: memberObj.id
          }));
        }
      }
      await Promise.all(promises);
    }
  }

  private async importCustomFront(frontStatuses: any[],
                              privacyMap: Map<string, PrivacyBucketId>,
                              flags: ImportFlags): Promise<void> {
    const currentDate = truncateCurrentDate();
    const memberMap = new Map<string, Member>()
    {
      const promises = [];
      for (const frontStatus of frontStatuses) {
        const customFront = {
          id: 0n,
          remoteId: null,
          name: frontStatus.name,
          pronouns: null,
          avatar: nullableField(frontStatus.avatarUrl),
          description: nullableField(frontStatus.desc),
          color: toColorInt(frontStatus.color),
          archived: false,
          custom: true,
          createdAt: currentDate,
          updatedAt: currentDate,
          folders: [],
        };
        promises.push(this.webService.createMemberRaw(customFront).then(id => memberMap.set(frontStatus._id, {
          ...customFront,
          id
        })));
      }
      await Promise.all(promises);
    }
    if (flags.privacyBuckets) {
      const promises = [];
      for (const frontStatus of frontStatuses) {
        const customFront = memberMap.get(frontStatus._id)!;
        const buckets = frontStatus.buckets.map((id: string) => privacyMap.get(id))
          .filter((id: bigint | undefined) => id != undefined);
        for (const bucket of buckets) {
          promises.push(this.webService.addPrivacyBucketMember(bucket, {
            ...customFront,
            remoteId: customFront.id
          }));
        }
      }
      await Promise.all(promises);
    }
  }
}

export interface ImportFlags {
  folders: boolean;
  members: boolean;
  customFront: boolean;
  customFields: boolean;
  privacyBuckets: boolean;
}
