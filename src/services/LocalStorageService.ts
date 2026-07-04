import { computed, inject, Injectable, isDevMode, NgZone, signal, WritableSignal } from '@angular/core';
import { Folder, FolderId } from './model/Folder';
import { Member, MemberId } from './model/Member';
import { FrontEntry, FrontEntryId } from './model/Front';
import { CustomField, CustomFieldDataId, CustomFieldDataValue, CustomFieldId } from './model/Field';
import { hookOnDataDeletion } from '../util/LocalDataDeletion';
import { Deletion } from './model/Deletion';
import { generateLocalId } from '../util/IdGenerator';

const WARN_NON_PERSISTENT = !isDevMode();
const IDB_VERSION = 1;
const IDB_NAME = "OpenPlural";
const IDB_FOLDERS = "folders";
const IDB_MEMBERS = "members";
const IDB_FRONT = "front";
const IDB_CUSTOM_FIELDS = "customFields";
const IDB_CUSTOM_FIELD_VALUES = "customFieldValues";
const IDB_METADATA = "metadata";
const IDB_DELETIONS = "deletions";

@Injectable({ providedIn: 'root' })
export class LocalStorageService {
  private readonly ngZone = inject(NgZone);

  private idb: IDBDatabase | undefined;
  private lastSyncTime = 0;
  private lastAbsSyncTime = 0;
  private fieldsReorderedSinceLastSync = false;

  private readonly _ready = signal(false);
  private readonly _dirty = signal(true);

  private readonly _folders: WritableSignal<Folder[]> = signal([]);
  private readonly _members: WritableSignal<Member[]> = signal([]);
  private readonly _front: WritableSignal<FrontEntry[]> = signal([]); // This only contains entries that are not synced yet or are still ongoing
  private readonly _customFields: WritableSignal<CustomField[]> = signal([]);
  private readonly _customFieldValues: WritableSignal<CustomFieldDataValue[]> = signal([]);

  readonly folders = this._folders.asReadonly();
  readonly members = this._members.asReadonly();
  readonly front = this._front.asReadonly();
  readonly ongoingFront = computed(() => this.front().filter((entry) => !entry.endedAt));
  readonly customFields = this._customFields.asReadonly();
  readonly customFieldValues = this._customFieldValues.asReadonly();

  readonly ready = this._ready.asReadonly();
  readonly dirty = this._dirty.asReadonly();

  constructor() {
    hookOnDataDeletion(async () => {
      this.lastSyncTime = 0;
      this.lastAbsSyncTime = 0;
      this.fieldsReorderedSinceLastSync = false;

      this.ngZone.run(() => {
        this._folders.set([]);
        this._members.set([]);
        this._front.set([]);
        this._customFields.set([]);
        this._customFieldValues.set([]);
      });
    });

    const req = window.indexedDB.open(IDB_NAME, IDB_VERSION);
    req.onerror = (e) => {
      console.error('Error opening IndexedDB:', e);
      alert('Failed to open IndexedDB!');
    };
    req.onblocked = () => {
      alert('Please close other tabs with Open Plural opened and refresh the page!');
    };
    req.onupgradeneeded = (e) => {
      // @ts-ignore
      const db: IDBDatabase = e.target.result;

      switch (e.oldVersion) {
        case 0: // Initial creation
          db.createObjectStore(IDB_FOLDERS, { keyPath: 'id' });
          db.createObjectStore(IDB_MEMBERS, { keyPath: 'id' });
          db.createObjectStore(IDB_FRONT, { keyPath: 'id' });
          db.createObjectStore(IDB_CUSTOM_FIELDS, { keyPath: 'id' });
          db.createObjectStore(IDB_CUSTOM_FIELD_VALUES, { keyPath: 'id' });
          db.createObjectStore(IDB_METADATA, { keyPath: 'key' });
          db.createObjectStore(IDB_DELETIONS, { keyPath: 'id' });
          break;
      }
    };
    req.onsuccess = () => {
      this.idb = req.result;

      // Load all data from IndexedDB
      Promise.all([
        this.readAll<any>(IDB_FOLDERS).then((f) => f.map(this.deserializeFolder)),
        this.readAll<any>(IDB_MEMBERS).then((m) => m.map(this.deserializeMember)),
        this.readAll<FrontEntry>(IDB_FRONT).then((f) => f.map(this.deserializeFrontEntry)),
        this.readAll<CustomField>(IDB_CUSTOM_FIELDS).then((f) => f.map(this.deserializeCustomField)),
        this.readAll<CustomFieldDataValue>(IDB_CUSTOM_FIELD_VALUES).then((fv) => fv.map(this.deserializeCustomFieldValue)),
        this.getMetadata<string>('lastSyncTime'),
        this.getMetadata<string>('lastAbsSyncTime'),
        this.getMetadata<string>('fieldsReorderedSinceLastSync')
      ])
        .then(([folders, members, front, customFields, customFieldValues, lastSyncTime, lastAbsSyncTime, fieldsReorderedSinceLastSync]) => {
          this._folders.set(folders);
          this._members.set(members);
          this._front.set(front);
          this._customFields.set(customFields);
          this._customFieldValues.set(customFieldValues);
          if (lastSyncTime) {
            this.lastSyncTime = parseInt(lastSyncTime);
          }
          if (lastAbsSyncTime) {
            this.lastAbsSyncTime = parseInt(lastAbsSyncTime);
          }
          if (fieldsReorderedSinceLastSync) {
            this.fieldsReorderedSinceLastSync = fieldsReorderedSinceLastSync === 'true';
          }
          this._ready.set(true);
        })
        .catch((e) => {
          console.error('Error loading data from IndexedDB:', e);
          alert('Failed to load data from IndexedDB!');
        });
    };
  }

  async clear(): Promise<void> {
    await this.clearAll(IDB_FOLDERS);
    await this.clearAll(IDB_MEMBERS);
    await this.clearAll(IDB_FRONT);
    await this.clearAll(IDB_CUSTOM_FIELDS);
    await this.clearAll(IDB_CUSTOM_FIELD_VALUES);
    await this.clearAll(IDB_METADATA);
    await this.clearAll(IDB_DELETIONS);
  }

  markDirty() {
    this._dirty.set(true);
  }

  async addFolder(folder: Folder): Promise<void> {
    await this.writeValue(IDB_FOLDERS, this.serializeFolder(folder));
    this._dirty.set(true);
    this.ngZone.run(() => this._folders.update((folders) => [...folders, folder]));
  }

  async addMember(member: Member): Promise<void> {
    await this.writeValue(IDB_MEMBERS, this.serializeMember(member));
    this._dirty.set(true);
    this.ngZone.run(() => this._members.update((members) => [...members, member]));
  }

  async addFrontEntry(frontEntry: FrontEntry): Promise<void> {
    await this.writeValue(IDB_FRONT, this.serializeFrontEntry(frontEntry));
    this._dirty.set(true);
    this.ngZone.run(() => this._front.update((front) => [...front, frontEntry]));
  }

  async addCustomField(field: CustomField): Promise<void> {
    await this.writeValue(IDB_CUSTOM_FIELDS, this.serializeCustomField(field));
    this._dirty.set(true);
    this.ngZone.run(() => this._customFields.update((fields) => [...fields, field]));
  }

  async addCustomFieldValue(value: CustomFieldDataValue): Promise<void> {
    await this.writeValue(IDB_CUSTOM_FIELD_VALUES, this.serializeCustomFieldValue(value));
    this._dirty.set(true);
    this.ngZone.run(() => this._customFieldValues.update((values) => [...values, value]));
  }

  async updateFolder(folder: Folder): Promise<void> {
    await this.writeValue(IDB_FOLDERS, this.serializeFolder(folder));
    this._dirty.set(true);
    this.ngZone.run(() => this._folders.update((folders) => folders.map((f) => f.id === folder.id ? folder : f)));
  }

  async updateMember(member: Member): Promise<void> {
    await this.writeValue(IDB_MEMBERS, this.serializeMember(member));
    this._dirty.set(true);
    this.ngZone.run(() => this._members.update((members) => members.map((m) => m.id === member.id ? member : m)));
  }

  async updateFrontEntry(frontEntry: FrontEntry): Promise<void> {
    await this.writeValue(IDB_FRONT, this.serializeFrontEntry(frontEntry));
    this._dirty.set(true);
    this.ngZone.run(() => this._front.update((front) => front.map((f) => f.id === frontEntry.id ? frontEntry : f)));
  }

  async updateCustomField(field: CustomField): Promise<void> {
    await this.writeValue(IDB_CUSTOM_FIELDS, this.serializeCustomField(field));
    this._dirty.set(true);
    this.ngZone.run(() => this._customFields.update((fields) => fields.map((f) => f.id === field.id ? field : f)));
  }

  async updateCustomFieldValue(value: CustomFieldDataValue): Promise<void> {
    await this.writeValue(IDB_CUSTOM_FIELD_VALUES, this.serializeCustomFieldValue(value));
    this._dirty.set(true);
    this.ngZone.run(() => this._customFieldValues.update((values) => values.map((fv) => fv.id === value.id ? value : fv)));
  }

  async removeFolderRecursively(folderId: FolderId, remoteId: bigint | null): Promise<void> {
    const folderIds = [{id: folderId, remoteId}];
    do {
      let foundChild = false;
      for (const {id} of folderIds) {
        const childFolders = this.folders().filter((f) => f.parentId === id);
        const newChildFolders = childFolders.filter((f) => !folderIds.some(({id}) => id === f.id));
        if (newChildFolders.length > 0) {
          folderIds.push(...newChildFolders.map((f) => {
            return {
              id: f.id,
              remoteId: f.remoteId
            };
          }));
          foundChild = true;
        }
      }
      if (!foundChild) {
        break;
      }
    } while (true);

    for (const {id, remoteId} of folderIds) {
      await this.removeFolder(id, remoteId);
    }
  }

  async removeFolder(folderId: FolderId, remoteId: FolderId | null): Promise<void> {
    await this.deleteValue(IDB_FOLDERS, folderId.toString());
    if (remoteId) {
      await this.writeValue(IDB_DELETIONS, this.serializeDeletion({
        id: generateLocalId(),
        resourceId: remoteId,
        resourceType: 'folder',
      }));
    }
    this._dirty.set(true);
    this.ngZone.run(() => this._folders.update((folders) => folders.filter((folder) => folder.id !== folderId)));
  }

  async removeMember(memberId: MemberId, remoteId: MemberId | null): Promise<void> {
    await this.deleteValue(IDB_MEMBERS, memberId.toString());
    if (remoteId) {
      await this.writeValue(IDB_DELETIONS, this.serializeDeletion({
        id: generateLocalId(),
        resourceId: remoteId,
        resourceType: 'member',
      }));
    }
    this._dirty.set(true);
    this.ngZone.run(() => this._members.update((members) => members.filter((member) => member.id !== memberId)));
  }

  async removeFrontEntry(frontEntryId: FrontEntryId): Promise<void> {
    await this.deleteValue(IDB_FRONT, frontEntryId.toString());
    this._dirty.set(true);
    this.ngZone.run(() => this._front.update((front) => front.filter((entry) => entry.id !== frontEntryId)));
  }

  async removeCustomField(customFieldId: CustomFieldId, remoteId: CustomFieldId | null): Promise<void> {
    await this.deleteValue(IDB_CUSTOM_FIELDS, customFieldId.toString());
    if (remoteId) {
      await this.writeValue(IDB_DELETIONS, this.serializeDeletion({
        id: generateLocalId(),
        resourceId: remoteId,
        resourceType: 'field',
      }));
    }
    this._dirty.set(true);
    this.ngZone.run(() => this._customFields.update((fields) => fields.filter((field) => field.id !== customFieldId)));
  }

  async removeCustomFieldValue(customFieldDataId: CustomFieldDataId, remoteId: CustomFieldDataId | null): Promise<void> {
    await this.deleteValue(IDB_CUSTOM_FIELD_VALUES, customFieldDataId.toString());
    if (remoteId) {
      await this.writeValue(IDB_DELETIONS, this.serializeDeletion({
        id: generateLocalId(),
        resourceId: remoteId,
        resourceType: 'field-value',
      }));
    }
    this._dirty.set(true);
    this.ngZone.run(() => this._customFieldValues.update((values) => values.filter((value) => value.id !== customFieldDataId)));
  }

  async setMetadata(key: string, value: any): Promise<void> {
    await this.writeValue(IDB_METADATA, { key, value });
  }

  async getMetadata<T>(key: string): Promise<T> {
    const res = await this.readValue(IDB_METADATA, key);
    return res?.value;
  }

  async updateSyncTime(syncTime: number, absolute: boolean): Promise<void> {
    if (absolute) {
      this.lastAbsSyncTime = syncTime;
    }
    this.lastSyncTime = syncTime;
    this.fieldsReorderedSinceLastSync = false;
    await this.setMetadata('lastSyncTime', this.lastSyncTime.toString());
    await this.setMetadata('lastAbsSyncTime', this.lastAbsSyncTime.toString());
    await this.setMetadata('fieldsReorderedSinceLastSync', 'false');
    await this.clearAll(IDB_DELETIONS);
    this.ngZone.run(() => this._dirty.set(false));
  }

  async notifyCustomFieldsReordered() {
    this.fieldsReorderedSinceLastSync = true;
    await this.setMetadata('fieldsReorderedSinceLastSync', 'true');
  }

  async getDeletions(): Promise<Deletion[]> {
    return this.readAll<Deletion>(IDB_DELETIONS).then((d) => d.map(this.deserializeDeletion));
  }

  isCustomFieldReorderRequired(): boolean {
    return this.fieldsReorderedSinceLastSync;
  }

  getLastSyncTime(): number {
    return this.lastSyncTime;
  }

  getLastAbsoluteSyncTime(): number {
    return this.lastAbsSyncTime;
  }

  private serializeFolder(folder: Folder): any {
    return {
      ...folder,
      id: folder.id.toString(),
      remoteId: folder.remoteId?.toString() || null,
      parentId: folder.parentId?.toString() || null,
      sort: folder.sort.toString(),
    };
  }

  private deserializeFolder(folder: any): Folder {
    return {
      ...folder,
      id: BigInt(folder.id),
      remoteId: folder.remoteId ? BigInt(folder.remoteId) : null,
      parentId: folder.parentId ? BigInt(folder.parentId) : null,
      sort: folder.sort ? BigInt(folder.sort) : 0n,
    };
  }

  private serializeMember(member: Member): any {
    return {
      ...member,
      id: member.id.toString(),
      remoteId: member.remoteId?.toString() || null,
      folders: member.folders.map((f) => f.toString()),
      sort: member.sort.toString(),
    };
  }

  private deserializeMember(member: any): Member {
    return {
      ...member,
      id: BigInt(member.id),
      remoteId: member.remoteId ? BigInt(member.remoteId) : null,
      folders: member.folders.map((f: string) => BigInt(f)),
      sort: member.sort ? BigInt(member.sort) : 0n,
    };
  }

  private serializeFrontEntry(frontEntry: FrontEntry): any {
    return {
      ...frontEntry,
      id: frontEntry.id.toString(),
      remoteId: frontEntry.remoteId?.toString() || null,
      member: frontEntry.member.toString(),
    };
  }

  private deserializeFrontEntry(frontEntry: any): FrontEntry {
    return {
      ...frontEntry,
      id: BigInt(frontEntry.id),
      remoteId: frontEntry.remoteId ? BigInt(frontEntry.remoteId) : null,
      member: BigInt(frontEntry.member),
    };
  }

  private serializeCustomField(customField: CustomField): any {
    return {
      ...customField,
      id: customField.id.toString(),
      remoteId: customField.remoteId?.toString() || null,
    };
  }

  private deserializeCustomField(customField: any): CustomField {
    return {
      ...customField,
      id: BigInt(customField.id),
      remoteId: customField.remoteId ? BigInt(customField.remoteId) : null,
    };
  }

  private serializeCustomFieldValue(customFieldValue: CustomFieldDataValue): any {
    return {
      ...customFieldValue,
      id: customFieldValue.id.toString(),
      remoteId: customFieldValue.remoteId?.toString() || null,
      fieldId: customFieldValue.fieldId.toString(),
      memberId: customFieldValue.memberId.toString(),
    };
  }

  private deserializeCustomFieldValue(customFieldValue: any): CustomFieldDataValue {
    return {
      ...customFieldValue,
      id: BigInt(customFieldValue.id),
      remoteId: customFieldValue.remoteId ? BigInt(customFieldValue.remoteId) : null,
      fieldId: BigInt(customFieldValue.fieldId),
      memberId: BigInt(customFieldValue.memberId),
    };
  }

  private serializeDeletion(deletion: Deletion): any {
    return {
      ...deletion,
      id: deletion.id.toString(),
      resourceId: deletion.resourceId.toString(),
    };
  }

  private deserializeDeletion(deletion: any): Deletion {
    return {
      ...deletion,
      id: BigInt(deletion.id),
      resourceId: BigInt(deletion.resourceId),
    };
  }

  private deleteValue(storeName: string, key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore(storeName, 'readwrite');
      const req = store.delete(key);
      req.onerror = reject;
      req.onsuccess = () => resolve();
    });
  }

  private writeValue(storeName: string, value: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore(storeName, 'readwrite');
      const req = store.put(value);
      req.onerror = reject;
      req.onsuccess = () => resolve();
    });
  }

  private readValue(storeName: string, key: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore(storeName, 'readonly');
      const req = store.get(key);
      req.onerror = reject;
      req.onsuccess = (e) => {
        // @ts-ignore
        resolve(e.target.result);
      };
    });
  }

  private readAll<T>(storeName: string): Promise<T[]> {
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore(storeName, 'readonly');
      const req = store.getAll();
      req.onerror = reject;
      req.onsuccess = (e) => {
        // @ts-ignore
        resolve(e.target.result);
      };
    });
  }

  private clearAll(storeName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore(storeName, 'readwrite');
      const req = store.clear();
      req.onerror = reject;
      req.onsuccess = (e) => {
        // @ts-ignore
        resolve(e.target.result);
      }
    });
  }

  private getObjectStore(storeName: string, modeName: 'readonly' | 'readwrite'): IDBObjectStore {
    const transaction = this.idb!.transaction(storeName, modeName);
    return transaction.objectStore(storeName);
  }

  async persistStorage() {
    // @ts-ignore
    if (navigator.storage && navigator.storage.persist) {
      const result = await navigator.storage.persist();
      if (result) {
        return;
      }
    }
    if (WARN_NON_PERSISTENT) {
      alert('Your browser has denied us persistent storage!\n\nIf this warning shows up repeatedly, please check your browser settings to allow persistent storage for this site. Until then, your data might be cleared by the browser when it needs to free up space.');
    }
  }
}
