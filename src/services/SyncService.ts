import { inject, Injectable, signal } from '@angular/core';
import { WebService } from './WebService';
import { Folder, FolderId } from './model/Folder';
import { LocalStorageService } from './LocalStorageService';
import { Member, MemberId } from './model/Member';
import { FrontEntry } from './model/Front';
import { CustomField, CustomFieldDataId, CustomFieldDataValue, CustomFieldId } from './model/Field';
import { compareCustomSort } from '../util/CustomSort';
import { AccountService } from './AccountService';
import { generateLocalId } from '../util/IdGenerator';
import {
  translateCustomFieldDataValue,
  translateFolder,
  translateFrontEntry,
  translateMember
} from '../util/IdTranslator';
import { TranslateService } from '@ngx-translate/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ToastService } from './ToastService';
import {SettingsService} from './SettingsService';

@Injectable({providedIn: 'root'})
export class SyncService {
  private readonly translate = inject(TranslateService);
  private readonly accountService = inject(AccountService);
  private readonly localStorageService = inject(LocalStorageService);
  private readonly settingsService = inject(SettingsService);
  private readonly toastService = inject(ToastService);
  private readonly webService = inject(WebService);

  private readonly syncFailed = toSignal<string>(this.translate.get('sync failed'), {
    initialValue: null,
  });
  private readonly syncFinished = toSignal<string>(this.translate.get('sync finished'), {
    initialValue: null,
  });

  private readonly _syncInProgress = signal(false);

  readonly syncInProgress = this._syncInProgress.asReadonly();

  async fullSync(): Promise<void> {
    if (!this.localStorageService.ready() || !this.localStorageService.dirty() || this.syncInProgress()) return;

    try {
      this._syncInProgress.set(true);

      console.log('[SyncService] Syncing...');

      let lastSyncTime = this.localStorageService.getLastSyncTime();
      if (!lastSyncTime) {
        lastSyncTime = 0;
      }
      const syncData = await this.webService.sync(new Date(lastSyncTime));

      this.accountService.updateAccountFromSync(syncData.user, syncData.friendCode);

      let remoteAddedData = false;
      remoteAddedData = await this.syncFolders(syncData.updatedFolders, syncData.folderIds, syncData.deletionDelta) || remoteAddedData;
      remoteAddedData = await this.syncMembers(syncData.updatedMembers, syncData.memberIds, syncData.deletionDelta) || remoteAddedData;
      remoteAddedData = await this.syncCustomFields(syncData.updatedFields, syncData.fieldIds, syncData.deletionDelta) || remoteAddedData;
      remoteAddedData = await this.syncCustomFieldValues(syncData.updatedFieldValues, syncData.fieldValueIds, syncData.deletionDelta) || remoteAddedData;
      remoteAddedData = await this.syncFrontEntries(syncData.front) || remoteAddedData;

      let serverTime: string;
      if (remoteAddedData) {
        const res = await this.webService.getServerTime();
        serverTime = res.time;
      } else {
        serverTime = syncData.time;
      }
      await this.localStorageService.updateSyncTime(Date.parse(serverTime));

      console.log('[SyncService] Sync complete');

      if (this.settingsService.settings().showSyncToast) {
        const syncFinished = this.syncFinished();
        if (syncFinished) {
          this.toastService.sendToast(syncFinished, 'alert-success');
        }
      }
    } catch (e) {
      const syncFailed = this.syncFailed();
      if (syncFailed) {
        this.toastService.sendToast(syncFailed, 'alert-warning');
      }
      throw e;
    } finally {
      this._syncInProgress.set(false);
    }
  }

  private async syncFrontEntries(serverFront: FrontEntry[]): Promise<boolean> {
    return this.syncGeneric(
      this.localStorageService.front(),
      serverFront,
      [],
      false,
      '',
      (frontEntry) => translateFrontEntry(this.localStorageService, frontEntry, 'id'),
      async (frontEntry) => await this.webService.createFrontEntry(frontEntry),
      async (_serverEntry, localEntry) => await this.webService.updateFrontEntry(localEntry),
      async () => {},
      async (frontEntry) => await this.localStorageService.addFrontEntry(frontEntry),
      async (frontEntry) => await this.localStorageService.updateFrontEntry(frontEntry),
      async (frontEntryId) => await this.localStorageService.removeFrontEntry(frontEntryId)
    );
  }

  private async syncFolders(updatedFolders: Folder[], folderIds: FolderId[], deletionDelta: boolean): Promise<boolean> {
    return this.syncGeneric(
      this.localStorageService.folders(),
      updatedFolders,
      folderIds,
      deletionDelta,
      'folder',
      (folder) => translateFolder(this.localStorageService, folder, 'id'),
      async (folder) => await this.webService.createFolder(folder),
      async (_, localFolder) => await this.webService.updateFolder(localFolder),
      async (remoteId) => await this.webService.deleteFolder(remoteId),
      async (folder) => await this.localStorageService.addFolder(folder),
      async (folder) => await this.localStorageService.updateFolder(folder),
      async (folderId) => await this.localStorageService.removeFolder(folderId, null),
    );
  }

  private async syncMembers(updatedMembers: Member[], memberIds: MemberId[], deletionDelta: boolean): Promise<boolean> {
    return this.syncGeneric(
      this.localStorageService.members(),
      updatedMembers,
      memberIds,
      deletionDelta,
      'member',
      (member) => translateMember(this.localStorageService, member, 'id'),
      async (member) => await this.webService.createMember(member),
      async (serverMember, localMember) => {
        await this.webService.updateMember(localMember);
        if (serverMember && serverMember.folders.length === localMember.folders.length && serverMember.folders.slice().sort().join(";") === localMember.folders.slice().sort().join(";")) {
          return;
        }
        await this.webService.updateMemberFolders(localMember);
      },
      async (memberId) => await this.webService.deleteMember(memberId),
      async (member) => await this.localStorageService.addMember(member),
      async (member) => await this.localStorageService.updateMember(member),
      async (memberId) => await this.localStorageService.removeMember(memberId, null)
    );
  }

  private async syncCustomFields(updatedFields: CustomField[], fieldIds: CustomFieldId[], deletionDelta: boolean): Promise<boolean> {
    let remoteAddedData = await this.syncGeneric(
      this.localStorageService.customFields(),
      updatedFields,
      fieldIds,
      deletionDelta,
      'field',
      (field) => field,
      async (field) => await this.webService.createCustomField(field),
      async (_, localField) => await this.webService.updateCustomField(localField),
      async (fieldId) => await this.webService.deleteCustomField(fieldId),
      async (field) => await this.localStorageService.addCustomField(field),
      async (field) => await this.localStorageService.updateCustomField(field),
      async (fieldId) => await this.localStorageService.removeCustomField(fieldId, null)
    );

    if (this.localStorageService.isCustomFieldReorderRequired()) {
      await this.webService.reorderCustomFields([...this.localStorageService.customFields()].sort(compareCustomSort).map(f => f.remoteId).filter(id => id != null));
      remoteAddedData = true;
    }
    return remoteAddedData;
  }

  private async syncCustomFieldValues(updatedFieldValues: CustomFieldDataValue[], fieldValueIds: CustomFieldDataId[], deletionDelta: boolean): Promise<boolean> {
    return this.syncGeneric(
      this.localStorageService.customFieldValues(),
      updatedFieldValues,
      fieldValueIds,
      deletionDelta,
      'field-value',
      (value) => translateCustomFieldDataValue(this.localStorageService, value, 'id'),
      async (value) => await this.webService.createCustomFieldValue(value),
      async (_, localValue) => await this.webService.updateCustomFieldValue(localValue),
      async (dataId) => await this.webService.deleteCustomFieldValue(dataId),
      async (value) => await this.localStorageService.addCustomFieldValue(value),
      async (value) => await this.localStorageService.updateCustomFieldValue(value),
      async (dataId) => await this.localStorageService.removeCustomFieldValue(dataId, null)
    );
  }

  private async syncGeneric<L extends { id: bigint; remoteId: bigint | null; updatedAt: string }, R extends { id: bigint; updatedAt: string }>(
    localItems: L[],
    updatedServerItems: R[],
    serverIds: bigint[],
    deletionDelta: boolean,
    deletionType: string,
    translateRemoteItem: (item: L) => L,
    webCreate: (item: L) => Promise<bigint>,
    webUpdate: (serverItem: R | null, localItem: L) => Promise<void>,
    webDelete: (remoteId: bigint) => Promise<void>,
    localAdd: (item: L) => Promise<void>,
    localUpdate: (item: L) => Promise<void>,
    localRemove: (itemId: bigint) => Promise<void>,
  ): Promise<boolean> {
    serverIds = [...serverIds];
    function isServerKnown(remoteId: bigint): boolean {
      if (updatedServerItems.find((v) => v.id === remoteId) != undefined) {
        return true;
      }
      if (deletionDelta) {
        return !serverIds.includes(remoteId);
      } else {
        return serverIds.includes(remoteId);
      }
    }

    function makeLocalItem(oldLocalItem: L | null, serverItem: R): L {
      // @ts-ignore
      const localItem: L = {
        ...serverItem,
        remoteId: serverItem.id,
        id: oldLocalItem?.id || generateLocalId(),
      };
      return translateRemoteItem(localItem);
    }

    let remoteAddedData = false;

    for (const localItem of localItems) {
      const localId = localItem.id;
      const remoteId = localItem.remoteId;
      if (remoteId) {
        if (isServerKnown(remoteId)) {
          const localUpdatedAt = Date.parse(localItem.updatedAt);

          const updatedServerItem = updatedServerItems.find((v) => v.id === remoteId);
          if (updatedServerItem) {
            const serverUpdatedAt = Date.parse(updatedServerItem.updatedAt);
            if (localUpdatedAt > serverUpdatedAt) {
              await webUpdate(updatedServerItem, localItem);
              remoteAddedData = true;
            } else if (localUpdatedAt < serverUpdatedAt) {
              await localUpdate(makeLocalItem(localItem, updatedServerItem));
            }
          } else if (localUpdatedAt > this.localStorageService.getLastSyncTime()) {
            await webUpdate(null, localItem);
            remoteAddedData = true;
          }
        } else {
          await localRemove(localId);
        }
      } else {
        const remoteId = await webCreate(localItem);
        await localUpdate({
          ...localItem,
          remoteId
        });
        remoteAddedData = true;
      }
    }

    localItems = [...localItems];
    for (const serverItem of updatedServerItems) {
      const remoteId = serverItem.id;
      if (!localItems.some(li => li.remoteId === remoteId)) {
        const localItem = makeLocalItem(null, serverItem);
        await localAdd(localItem);
        localItems.push(localItem);
      }
    }
    if (deletionDelta) {
      const deletions = await this.localStorageService.getDeletions();
      for (const deletion of deletions) {
        if (deletion.resourceType === deletionType && !serverIds.includes(deletion.resourceId) && !localItems.find(li => li.remoteId === deletion.resourceId)) {
          serverIds.push(deletion.resourceId);
          await webDelete(deletion.resourceId);
        }
      }
    } else {
      for (const remoteId of serverIds) {
        if (!localItems.some(li => li.remoteId === remoteId)) {
          await webDelete(remoteId);
        }
      }
    }
    return remoteAddedData;
  }
}
