import {Component, computed, inject, OnInit, signal} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { EditPageContainer } from '../../../components/container/edit-page-container/edit-page-container';
import { LocalStorageService } from '../../../services/LocalStorageService';
import { Misrouted } from '../../../components/misrouted/misrouted';
import { TranslatePipe } from '@ngx-translate/core';
import { toColor } from '../../../util/ColorConvert';
import { SyncService } from '../../../services/SyncService';
import { Location } from '@angular/common';
import { PopupConfirm } from '../../../components/popup-confirm/popup-confirm';
import { nullableField } from '../../../util/NullString';
import { PrivacyBucketId, SimplePrivacyBucket } from '../../../services/model/Privacy';
import { WebService } from '../../../services/WebService';
import { PrivacyBucketList } from '../../../components/privacy-bucket-list/privacy-bucket-list';
import { openDialog } from '../../../util/CommonFunctions';
import { SettingsService } from '../../../services/SettingsService';
import { truncateCurrentDate } from '../../../util/DateTruncate';
import { ColorInput } from '../../../components/color-input/color-input';
import {MarkdownBox} from "../../../components/markdown-box/markdown-box";
import {Folder} from '../../../services/model/Folder';
import {compareCustomSort} from '../../../util/CustomSort';

@Component({
  selector: 'app-folder-page',
    imports: [
        EditPageContainer,
        Misrouted,
        TranslatePipe,
        PopupConfirm,
        PrivacyBucketList,
        ColorInput,
        MarkdownBox,
    ],
  templateUrl: './folder-page.html',
})
export class FolderPage implements OnInit {
  private readonly location = inject(Location);
  private readonly route = inject(ActivatedRoute);
  private readonly localStorageService = inject(LocalStorageService);
  private readonly settingsService = inject(SettingsService);
  private readonly syncService = inject(SyncService);
  private readonly webService = inject(WebService);

  protected readonly id = toSignal(
    this.route.paramMap.pipe(
      map((params) => {
        const id = params.get('id');
        return id ? BigInt(id) : null;
      }),
    ),
    { initialValue: null },
  );
  protected readonly folder = computed(() => {
    const id = this.id();
    return this.localStorageService.folders().find((f) => f.id === id);
  });
  protected readonly memberCounts = computed(() => {
    const id = this.id();
    if (!id) return null;

    const members = this.localStorageService
      .members()
      .filter((m) => !m.custom)
      .filter((m) => m.folders.includes(id));
    const count = members.filter((m) => !m.archived).length;
    const archivedCount = members.filter((m) => m.archived).length;
    return { count, archivedCount };
  });
  protected readonly customSortEditor = computed(() => this.settingsService.settings().customSortEditor);
  protected readonly description = signal<string>('');
  protected readonly color = signal<bigint | null>(null);
  protected readonly privacyIds = computed(() => this.privacy()?.map((bucket) => bucket.id) || []);
  protected readonly privacy = signal<SimplePrivacyBucket[] | null>(null);
  protected readonly loadingPrivacy = signal<boolean>(false);
  protected readonly folderCreationDate = computed(() => {
    const folder = this.folder();
    if (!folder) return null;
    return this.settingsService.formatDate(Date.parse(folder.createdAt), 'DateTime');
  });
  protected readonly showCreationDate = signal<boolean>(false);
  protected readonly showMemberCount = signal<boolean>(false);

  ngOnInit() {
    this.description.set(this.folder()?.description || '');
  }

  protected async loadPrivacy() {
    const folder = this.folder();
    if (!folder || !folder.remoteId) return;

    this.loadingPrivacy.set(true);
    const privacy = await this.webService.getFolderPrivacy(folder);
    this.privacy.set(privacy.sort(compareCustomSort));
  }

  protected async updatePrivacy(ids: PrivacyBucketId[]) {
    const folder = this.folder();
    if (!folder || !folder.remoteId) return;

    const privacyIds = this.privacyIds();
    for (const id of ids) {
      if (!privacyIds.includes(id)) {
        const bucket = await this.webService.addPrivacyBucketFolder(id, folder);
        this.privacy.update(buckets => {
          if (buckets) {
            return [...buckets, bucket].sort(compareCustomSort);
          } else {
            return [bucket];
          }
        });
      }
    }
    for (const id of privacyIds) {
      if (!ids.includes(id)) {
        await this.webService.removePrivacyBucketFolder(id, folder);
        this.privacy.update(buckets => {
          if (buckets) {
            return buckets.filter((b) => b.id !== id);
          } else {
            return null;
          }
        });
      }
    }

    if (this.localStorageService.folders().find((f) => f.parentId === folder.id)) {
      openDialog('folderPrivacyRecursive');
    }
  }

  protected async updateRecursivePrivacy(): Promise<void> {
    const folder = this.folder();
    if (!folder) return;

    await this.updateRecursivePrivacy0(this.privacyIds(), folder);
  }

  private async updateRecursivePrivacy0(ids: PrivacyBucketId[], folder: Folder): Promise<void> {
    if (!folder.remoteId) return;

    const childFolders = this.localStorageService.folders().filter((f) => f.parentId === folder.id);
    for (const childFolder of childFolders) {
      await this.webService.setFolderPrivacy(ids, childFolder);
      await this.updateRecursivePrivacy0(ids, childFolder);
    }
  }

  protected colorSelected(color: bigint) {
    this.color.set(color);
  }

  protected async save() {
    const folder = this.folder();
    if (!folder) return;

    const form = document.getElementById('folderForm') as HTMLFormElement;
    const formData = new FormData(form);
    const name = formData.get('name')?.toString();
    const emoji = formData.get('emoji')?.toString();
    const sort = formData.get('sort')?.toString();

    if (name && name.length > 0) {
      const updated = Object.assign({}, folder);
      updated.name = name;
      updated.emoji = nullableField(emoji);
      updated.updatedAt = truncateCurrentDate();

      if (sort !== undefined && sort !== null) {
        updated.sort = BigInt(sort);
      }

      const newDescription = this.description();
      if (newDescription != null) {
        updated.description = nullableField(newDescription);
      }

      const newColor = this.color();
      if (newColor != null) {
        updated.color = newColor;
      }

      await this.localStorageService.updateFolder(updated);
      this.syncService.fullSync();
      this.location.back();
    }
  }

  protected async delete() {
    const folder = this.folder();
    if (!folder) return;

    await this.localStorageService.removeFolderRecursively(folder.id, folder.remoteId);
    this.syncService.fullSync();
    this.location.back();
  }

  protected readonly toColor = toColor;
  protected readonly openDialog = openDialog;
}
