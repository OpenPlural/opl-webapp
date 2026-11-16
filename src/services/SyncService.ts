import { inject, Injectable, signal } from '@angular/core';
import { WebService } from './WebService';
import { LocalStorageService } from './LocalStorageService';
import { AccountService } from './AccountService';
import { generateLocalId } from '../util/IdGenerator';
import {
  translateCustomFieldDataValue,
  translateFolder,
  translateFrontEntry,
  translateMember,
  translatePhotoAlbum,
  translatePollAnswer
} from '../util/IdTranslator';
import { TranslateService } from '@ngx-translate/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ToastService } from './ToastService';
import {SettingsService} from './SettingsService';
import { FrontEntry, FrontEntryId } from './model/Front';

type Syncable = { id: bigint; remoteId: bigint | null; updatedAt: string; };

@Injectable({providedIn: 'root'})
export class SyncService {
  private readonly translate = inject(TranslateService);
  private readonly accountService = inject(AccountService);
  private readonly localStorageService = inject(LocalStorageService);
  private readonly settingsService = inject(SettingsService);
  private readonly toastService = inject(ToastService);
  private readonly webService = inject(WebService);

  private readonly syncFailed = toSignal<string>(this.translate.getStreamOnTranslationChange('sync.failed'), {
    initialValue: null,
  });
  private readonly syncFinished = toSignal<string>(this.translate.getStreamOnTranslationChange('sync.finished'), {
    initialValue: null,
  });
  private readonly frontSyncFailed = toSignal<string>(this.translate.getStreamOnTranslationChange('sync.front.failed'), {
    initialValue: null,
  });
  private readonly frontSyncFinished = toSignal<string>(this.translate.getStreamOnTranslationChange('sync.front.finished'), {
    initialValue: null,
  });
  private readonly frontSyncRetrying = toSignal<string>(this.translate.getStreamOnTranslationChange('sync.front.retry'), {
    initialValue: null,
  });

  private readonly _syncInProgress = signal(false);
  private readonly _syncQueued = signal(false);

  readonly syncInProgress = this._syncInProgress.asReadonly();

  async frontSync(recurse: number = 0): Promise<void> {
    if (this.syncInProgress()) {
      return;
    }

    if (recurse > 10) {
      console.error('[SyncService] Front sync failed after 10 recursive attempts. Giving up.');
      return;
    }

    let frontSyncRequired = false;
    try {
      this._syncInProgress.set(true);

      console.log('[SyncService] Front sync running...');

      const front = this.localStorageService.front();
      const syncResponse = await this.webService.syncFront({
        front: this.getTranslatedItems(front, (frontEntry) =>
          translateFrontEntry(this.localStorageService, frontEntry, 'remoteId'),
        ),
      });
      frontSyncRequired = await this.syncFront(front, syncResponse.assignFront, syncResponse.front);

      console.log('[SyncService] Front sync completed');

      if (!frontSyncRequired && this.settingsService.settings().showSyncToast) {
        const frontSyncFinished = this.frontSyncFinished();
        if (frontSyncFinished) {
          this.toastService.sendToast(frontSyncFinished, 'alert-success');
        }
      }
      return;
    } catch (e) {
      frontSyncRequired = false;
      console.error('[SyncService] Front sync failed', e);
      const frontSyncFailed = this.frontSyncFailed();
      if (frontSyncFailed) {
        this.toastService.sendToast(frontSyncFailed, 'alert-warning');
      }
    } finally {
      this._syncInProgress.set(false);
      if (frontSyncRequired) {
        const frontSyncRetrying = this.frontSyncRetrying();
        if (frontSyncRetrying) {
          this.toastService.sendToast(frontSyncRetrying, 'alert-warning');
        }
        await this.frontSync(recurse + 1);
      }
    }

    console.log('[SyncService] Trying full sync after front sync failure...');
    await this.fullSync();
  }

  async fullSync(): Promise<void> {
    const syncInProgress = this.syncInProgress();
    if (!this.localStorageService.ready() || !this.localStorageService.dirty() || syncInProgress) {
      if (syncInProgress) {
        this._syncQueued.set(true);
      }
      return;
    }

    let frontSyncRequired = false;
    try {
      this._syncInProgress.set(true);

      console.log('[SyncService] Syncing...');

      let lastSyncTime = this.localStorageService.getLastSyncTime();
      if (!lastSyncTime) {
        lastSyncTime = 0;
      }

      const doServerUpdates = !this.accountService.virtualSessionToken();

      const folders = this.localStorageService.folders();
      const members = this.localStorageService.members();
      const customFields = this.localStorageService.customFields();
      const customFieldValues = this.localStorageService.customFieldValues();
      const polls = this.localStorageService.polls();
      const pollAnswers = this.localStorageService.pollAnswers();
      const photoAlbums = this.localStorageService.photoAlbums();
      const front = this.localStorageService.front();

      const { known: knownFolders, updated: updatedFolders } = this.getKnownAndUpdated(folders, lastSyncTime, doServerUpdates);
      const { known: knownMembers, updated: updatedMembers } = this.getKnownAndUpdated(members, lastSyncTime, doServerUpdates);
      const { known: knownFields, updated: updatedFields } = this.getKnownAndUpdated(customFields, lastSyncTime, doServerUpdates);
      const { known: knownFieldValues, updated: updatedFieldValues } = this.getKnownAndUpdated(customFieldValues, lastSyncTime, doServerUpdates);
      const { known: knownPolls, updated: updatedPolls } = this.getKnownAndUpdated(polls, lastSyncTime, doServerUpdates);
      const { known: knownPollAnswers, updated: updatedPollAnswers } = this.getKnownAndUpdated(pollAnswers, lastSyncTime, doServerUpdates);
      const { known: knownPhotoAlbums, updated: updatedPhotoAlbums } = this.getKnownAndUpdated(photoAlbums, lastSyncTime, doServerUpdates);

      const deleted = doServerUpdates ? await this.localStorageService.getDeletions() : [];

      const syncResponse = await this.webService.sync({
        time: new Date(lastSyncTime).toISOString(),
        known: {
          folders: knownFolders,
          members: knownMembers,
          fields: knownFields,
          fieldValues: knownFieldValues,
          polls: knownPolls,
          pollAnswers: knownPollAnswers,
          photoAlbums: knownPhotoAlbums,
        },
        updated: this.skipEmptyObject({
          folders: this.getTranslatedItems(updatedFolders, (folder) => translateFolder(this.localStorageService, updatedFolders, folder, 'remoteId')),
          members: this.getTranslatedItems(updatedMembers, (member) => translateMember(this.localStorageService, member, 'remoteId')),
          fields: this.getTranslatedItems(updatedFields, (field) => field),
          fieldValues: this.getTranslatedItems(updatedFieldValues, (value) => translateCustomFieldDataValue(this.localStorageService, value, 'remoteId')),
          polls: this.getTranslatedItems(updatedPolls, (poll) => poll),
          pollAnswers: this.getTranslatedItems(updatedPollAnswers, (answer) => translatePollAnswer(this.localStorageService, answer, 'remoteId')),
          photoAlbums: this.getTranslatedItems(updatedPhotoAlbums, (album) => translatePhotoAlbum(this.localStorageService, album, 'remoteId')),
        }),
        deleted: this.skipEmptyObject({
          folders: deleted.filter((d) => d.resourceType === 'folder').map((d) => d.resourceId),
          members: deleted.filter((d) => d.resourceType === 'member').map((d) => d.resourceId),
          fields: deleted.filter((d) => d.resourceType === 'field').map((d) => d.resourceId),
          fieldValues: deleted.filter((d) => d.resourceType === 'field-value').map((d) => d.resourceId),
          polls: deleted.filter((d) => d.resourceType === 'poll').map((d) => d.resourceId),
          pollAnswers: deleted.filter((d) => d.resourceType === 'poll-answer').map((d) => d.resourceId),
          photoAlbums: deleted.filter((d) => d.resourceType === 'photo-album').map((d) => d.resourceId),
        }),
        front: this.getTranslatedItems(front, (frontEntry) =>
          translateFrontEntry(this.localStorageService, frontEntry, 'remoteId'),
        ),
      });

      await this.doLocalUpdates(
        folders,
        updatedFolders,
        syncResponse.delete?.folders,
        syncResponse.assign?.folders,
        syncResponse.update?.folders,
        (folder) => translateFolder(this.localStorageService, syncResponse.update?.folders || [], folder, 'id'),
        async (folder) => await this.localStorageService.addFolder(folder),
        async (folder) => await this.localStorageService.updateFolder(folder),
        async (folderId) => await this.localStorageService.removeFolderRecursively(folderId, null),
      );
      await this.doLocalUpdates(
        members,
        updatedMembers,
        syncResponse.delete?.members,
        syncResponse.assign?.members,
        syncResponse.update?.members,
        (member) => translateMember(this.localStorageService, member, 'id'),
        async (member) => await this.localStorageService.addMember(member),
        async (member) => await this.localStorageService.updateMember(member),
        async (memberId) => await this.localStorageService.removeMember(memberId, null),
      );
      await this.doLocalUpdates(
        customFields,
        updatedFields,
        syncResponse.delete?.fields,
        syncResponse.assign?.fields,
        syncResponse.update?.fields,
        (field) => field,
        async (field) => await this.localStorageService.addCustomField(field),
        async (field) => await this.localStorageService.updateCustomField(field),
        async (fieldId) => await this.localStorageService.removeCustomField(fieldId, null),
      );
      await this.doLocalUpdates(
        customFieldValues,
        updatedFieldValues,
        syncResponse.delete?.fieldValues,
        syncResponse.assign?.fieldValues,
        syncResponse.update?.fieldValues,
        (value) => translateCustomFieldDataValue(this.localStorageService, value, 'id'),
        async (value) => await this.localStorageService.addCustomFieldValue(value),
        async (value) => await this.localStorageService.updateCustomFieldValue(value),
        async (valueId) => await this.localStorageService.removeCustomFieldValue(valueId, null),
      );
      await this.doLocalUpdates(
        polls,
        updatedPolls,
        syncResponse.delete?.polls,
        syncResponse.assign?.polls,
        syncResponse.update?.polls,
        (poll) => poll,
        async (poll) => await this.localStorageService.addPoll(poll),
        async (poll) => await this.localStorageService.updatePoll(poll),
        async (pollId) => await this.localStorageService.removePoll(pollId, null),
      );
      await this.doLocalUpdates(
        pollAnswers,
        updatedPollAnswers,
        syncResponse.delete?.pollAnswers,
        syncResponse.assign?.pollAnswers,
        syncResponse.update?.pollAnswers,
        (answer) => translatePollAnswer(this.localStorageService, answer, 'id'),
        async (answer) => await this.localStorageService.addPollAnswer(answer),
        async (answer) => await this.localStorageService.updatePollAnswer(answer),
        async (answerId) => await this.localStorageService.removePollAnswer(answerId, null),
      );
      await this.doLocalUpdates(
        photoAlbums,
        updatedPhotoAlbums,
        syncResponse.delete?.photoAlbums,
        syncResponse.assign?.photoAlbums,
        syncResponse.update?.photoAlbums,
        (photoAlbum) => translatePhotoAlbum(this.localStorageService, photoAlbum, 'id'),
        async (photoAlbum) => await this.localStorageService.addPhotoAlbum(photoAlbum),
        async (photoAlbum) => await this.localStorageService.updatePhotoAlbum(photoAlbum),
        async (photoAlbumId) => await this.localStorageService.removePhotoAlbum(photoAlbumId, null),
      );
      frontSyncRequired = await this.syncFront(front, syncResponse.assignFront, syncResponse.front);

      this.accountService.updateAccountFromSync(syncResponse.user, syncResponse.friendCode);
      await this.localStorageService.finalizeSync(Date.parse(syncResponse.time));

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
        this.toastService.sendToast(syncFailed, 'alert-error');
      }
      throw e;
    } finally {
      this._syncInProgress.set(false);
      setTimeout(() => {
        if (this._syncQueued()) {
          this._syncQueued.set(false);
          this.localStorageService.markDirty();
          this.fullSync();
        } else if (frontSyncRequired) {
          this.frontSync();
        }
      }, 50);
    }
  }

  private skipEmptyObject<T>(obj: T): T | undefined {
    for (const key in obj) {
      const value = obj[key];
      if (Array.isArray(value)) {
        if (value.length > 0) {
          return obj;
        }
      }
    }
    return undefined;
  }

  private getKnownAndUpdated<T extends Syncable>(
    known: T[],
    lastSyncTime: number,
    doServerUpdates: boolean,
  ): { known: bigint[]; updated: T[] } {
    return {
      known: known.filter((i) => !!i.remoteId).map((i) => i.remoteId!),
      updated: doServerUpdates ? known.filter((i) => Date.parse(i.updatedAt) >= lastSyncTime) : [],
    };
  }

  private getTranslatedItems<T extends Syncable>(
    items: T[],
    translateLocalItem: (item: T) => T,
  ): T[] {
    return items.map((i) => {
      i = translateLocalItem(i);
      if (i.remoteId) {
        i.id = i.remoteId;
      } else {
        i.id = 0n;
      }
      // @ts-ignore
      i.remoteId = undefined;
      return i;
    });
  }

  private async doLocalUpdates<T extends Syncable>(
    localKnown: T[],
    localUpdated: T[],
    remove: bigint[] | undefined,
    assign: bigint[] | undefined,
    update: T[] | undefined,
    translateRemoteItem: (item: T) => T,
    createLocal: (item: T) => Promise<void>,
    updateLocal: (item: T) => Promise<void>,
    removeLocal: (id: bigint) => Promise<void>,
  ) {
    if (remove) {
      await Promise.all(
        remove.map((id) => {
          return removeLocal(id);
        }),
      );
    }

    if (assign) {
      let nextIndex = 0;
      for (const item of localUpdated) {
        if (!item.remoteId && assign.length > nextIndex) {
          const remoteId = assign[nextIndex];
          await updateLocal({
            ...item,
            remoteId,
          });
          nextIndex++;
        }
      }
    }

    if (update) {
      await Promise.all(
        update.map((serverItem) => {
          const oldLocalItem = localKnown.find((l) => l.remoteId === serverItem.id);
          if (oldLocalItem) {
            const localItem = translateRemoteItem({
              ...serverItem,
              remoteId: serverItem.id,
              id: oldLocalItem.id,
            });
            return updateLocal(localItem);
          } else {
            const localItem = translateRemoteItem({
              ...serverItem,
              remoteId: serverItem.id,
              id: generateLocalId(),
            });
            return createLocal(localItem);
          }
        }),
      );
    }
  }

  private async syncFront(
    localFront: FrontEntry[],
    assignedFront: FrontEntryId[],
    remoteFront: FrontEntry[],
  ): Promise<boolean> {
    let nextIndex = 0;
    for (const item of localFront) {
      if (!item.remoteId && assignedFront.length > nextIndex) {
        item.remoteId = assignedFront[nextIndex];
        await this.localStorageService.updateFrontEntry({
          ...item,
        });
        nextIndex++;
      }
    }

    localFront = this.localStorageService.front();

    let frontSyncRequired = false;
    for (let remoteEntry of remoteFront) {
      const localEntry = localFront.find((f) => f.remoteId === remoteEntry.id);
      remoteEntry = translateFrontEntry(this.localStorageService, remoteEntry, 'id');
      if (localEntry) {
        if (localEntry.endedAt && !remoteEntry.endedAt) {
          frontSyncRequired = true;
        } else {
          await this.localStorageService.updateFrontEntry({
            ...remoteEntry,
            remoteId: remoteEntry.id,
            id: localEntry.id,
          });
        }
      } else {
        await this.localStorageService.addFrontEntry({
          ...remoteEntry,
          remoteId: remoteEntry.id,
          id: generateLocalId(),
        });
      }
    }

    for (const localEntry of localFront) {
      if (!remoteFront.find((f) => f.id === localEntry.remoteId)) {
        if (localEntry.endedAt && localEntry.remoteId) {
          await this.localStorageService.removeFrontEntry(localEntry.id);
        } else {
          frontSyncRequired = true;
        }
      }
    }
    return frontSyncRequired;
  }
}
