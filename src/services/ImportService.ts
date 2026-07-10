import {inject, Injectable} from '@angular/core';
import {nullableField} from '../util/NullString';
import {toColorInt} from '../util/ColorConvert';
import {WebService} from './WebService';
import {CUSTOM_FIELD_DATA_TYPE_DATETIME, CUSTOM_FIELD_DATA_TYPE_TEXT} from './model/Field';

@Injectable({ providedIn: 'root' })
export class ImportService {
  private readonly webService = inject(WebService);

  async importFromOpenPlural(input: string, flags: ImportFlags) {
    const obj = JSON.parse(input);

    let privacy: any[] | null = null;
    if (flags.privacyBuckets && 'privacyBuckets' in obj) {
      privacy = obj.privacyBuckets;
    }

    let fields: any[] | null = null;
    if (flags.customFields && 'customFields' in obj) {
      fields = obj.customFields;
    }

    let folders: any[] | null = null;
    if (flags.folders && 'folders' in obj) {
      folders = obj.folders;
    }

    let members: any[] | null = null;
    if (flags.members && 'members' in obj) {
      members = obj.members;
    }

    await this.webService.import({
      privacy,
      fields,
      folders,
      members,
      truncate: flags.truncate,
    });
  }

  async importFromSimplyPlural(input: string, flags: ImportFlags) {
    const obj = JSON.parse(input);

    let privacy: any[] | null = null;
    if (flags.privacyBuckets && 'privacyBuckets' in obj) {
      privacy = await this.importPrivacyBuckets(obj.privacyBuckets);
    }

    let fields: any[] | null = null;
    if (flags.customFields && 'customFields' in obj) {
      fields = await this.importCustomFields(obj.customFields);
    }

    let folders: any[] | null = null;
    if (flags.folders && 'groups' in obj) {
      folders = await this.importFolders(obj.groups);
    }

    let members: any[] | null = null;
    if (flags.members && 'members' in obj && 'groups' in obj) {
      members = await this.importMembers(obj.members, obj.groups, flags);
    }

    if (flags.customFront && 'frontStatuses' in obj) {
      const customFront = await this.importCustomFront(obj.frontStatuses);

      if (members) {
        members.push(...customFront);
      } else {
        members = customFront;
      }
    }

    await this.webService.import({
      privacy,
      fields,
      folders,
      members,
      truncate: flags.truncate,
    });
  }

  private async importPrivacyBuckets(privacyBuckets: any[]): Promise<any[]> {
    const newBuckets: any[] = [];
    for (const bucket of privacyBuckets) {
      newBuckets.push({
        id: bucket._id,
        sort: bucket.rank,
        name: bucket.name,
        description: nullableField(bucket.desc),
        emoji: nullableField(bucket.icon),
        color: toColorInt(bucket.color),
      });
    }
    newBuckets.sort((a, b) => a.sort.toString().localeCompare(b.sort.toString()));
    for (let i = 0; i < newBuckets.length; i++) {
      newBuckets[i].sort = BigInt(i);
    }
    return newBuckets;
  }

  private async importCustomFields(customFields: any[]): Promise<any[]> {
    const newFields: any[] = [];
    for (const customField of customFields) {
      let dataType;
      if (customField.type === 6 || customField.type === 6n) {
        dataType = CUSTOM_FIELD_DATA_TYPE_DATETIME;
      } else {
        dataType = CUSTOM_FIELD_DATA_TYPE_TEXT;
      }
      newFields.push({
        id: customField._id,
        sort: customField.order,
        name: customField.name,
        dataType,
        privacy: customField.buckets || [],
      });
    }
    newFields.sort((a, b) => a.sort.toString().localeCompare(b.sort.toString()));
    for (let i = 0; i < newFields.length; i++) {
      newFields[i].sort = BigInt(i);
    }
    return newFields;
  }

  private async importFolders(groups: any[]): Promise<any[]> {
    const newFolders: any[] = [];
    for (const group of groups) {
      newFolders.push({
        id: group._id,
        parentId: group.parent,
        name: group.name,
        description: nullableField(group.desc),
        emoji: nullableField(group.emoji),
        color: toColorInt(group.color),
        sort: 0n,
        privacy: group.buckets || [],
      });
    }
    return newFolders;
  }

  private async importMembers(members: any[], groups: any[], flags: ImportFlags): Promise<any[]> {
    const newMembers: any[] = [];
    for (const member of members) {
      let folders: any[] = [];
      if (flags.folders) {
        folders = groups.filter((group: any) => group.members.includes(member._id)).map((group: any) => group._id);
      }
      let fields: any = {};
      if (flags.customFields) {
        const info = member.info;
        if (info) {
          for (const fieldId of Object.keys(info)) {
            const value = info[fieldId].trim();
            if (value.length > 0) {
              fields[fieldId] = value;
            }
          }
        }
      }

      let archived = member.archived;
      if (archived === null || archived === undefined) {
        archived = false;
      }

      newMembers.push({
        name: member.name,
        pronouns: nullableField(member.pronouns),
        avatar: nullableField(member.avatarUrl),
        description: nullableField(member.desc),
        color: toColorInt(member.color),
        archived,
        custom: false,
        sort: 0n,
        folders,
        fields,
        privacy: member.buckets || [],
      });
    }
    return newMembers;
  }

  private async importCustomFront(frontStatuses: any[]): Promise<any[]> {
    const newMembers: any[] = [];
    for (const frontStatus of frontStatuses) {
      newMembers.push({
        name: frontStatus.name,
        pronouns: null,
        avatar: nullableField(frontStatus.avatarUrl),
        description: nullableField(frontStatus.desc),
        color: toColorInt(frontStatus.color),
        archived: false,
        custom: true,
        sort: 0n,
        folders: [],
        fields: {},
        privacy: frontStatus.buckets || [],
      });
    }
    return newMembers;
  }
}

export interface ImportFlags {
  folders: boolean;
  members: boolean;
  customFront: boolean;
  customFields: boolean;
  privacyBuckets: boolean;
  truncate: boolean;
}
