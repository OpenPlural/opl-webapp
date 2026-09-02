import { Component, computed, inject, input, output, signal } from '@angular/core';
import { makePhotoAlbum, PhotoAlbum } from '../../services/model/Gallery';
import { IconButton } from '../icon-button/icon-button';
import { VerticalCenter } from '../vertical-center/vertical-center';
import { toColor } from '../../util/ColorConvert';
import { MarkdownBox } from '../markdown-box/markdown-box';
import { TranslatePipe } from '@ngx-translate/core';
import { PopupConfirm } from '../popup-confirm/popup-confirm';
import { PopupInput } from '../popup-input/popup-input';
import { openDialog } from '../../util/CommonFunctions';
import { LocalStorageService } from '../../services/LocalStorageService';
import { SyncService } from '../../services/SyncService';
import { nullableField } from '../../util/NullString';
import { truncateCurrentDate } from '../../util/DateTruncate';
import { ToggleIconButton } from '../toggle-icon-button/toggle-icon-button';
import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { ErrorService } from '../../services/ErrorService';
import { MemberId } from '../../services/model/Member';
import { PrivacyBucketId, SimplePrivacyBucket } from '../../services/model/Privacy';
import { compareCustomSort } from '../../util/CustomSort';
import { WebService } from '../../services/WebService';
import { PrivacyBucketList } from '../privacy-bucket-list/privacy-bucket-list';

@Component({
  selector: 'app-member-gallery',
  imports: [
    IconButton,
    VerticalCenter,
    MarkdownBox,
    TranslatePipe,
    PopupConfirm,
    PopupInput,
    ToggleIconButton,
    CdkDropList,
    CdkDrag,
    PrivacyBucketList,
  ],
  templateUrl: './member-gallery.html',
})
export class MemberGallery {
  private readonly errorService = inject(ErrorService);
  private readonly localStorageService = inject(LocalStorageService);
  private readonly syncService = inject(SyncService);
  private readonly webService = inject(WebService);

  readonly memberId = input.required<MemberId>();
  readonly gallery = input.required<PhotoAlbum[]>();
  readonly editable = input.required<boolean>();
  readonly closeGallery = output();

  protected readonly album = signal<PhotoAlbum | null>(null);
  protected readonly description = signal<string>('');
  protected readonly photoUrls = signal<string[]>([]);
  protected readonly deleting = signal<number[]>([]);
  protected readonly editing = signal<boolean>(false);
  protected readonly reorder = signal<boolean>(false);

  protected readonly privacyIds = computed(() => this.privacy()?.map((bucket) => bucket.id) || []);
  protected readonly privacy = signal<SimplePrivacyBucket[] | null>(null);
  protected readonly loadingPrivacy = signal<boolean>(false);

  protected async loadPrivacy() {
    const album = this.album();
    if (!album || !album.remoteId) return;

    this.loadingPrivacy.set(true);
    const privacy = await this.webService.getPhotoAlbumPrivacy(album);
    this.privacy.set(privacy.sort(compareCustomSort));
  }

  protected async updatePrivacy(ids: PrivacyBucketId[]) {
    const album = this.album();
    if (!album || !album.remoteId) return;

    const privacyIds = this.privacyIds();
    for (const id of ids) {
      if (!privacyIds.includes(id)) {
        const bucket = await this.webService.addPrivacyBucketPhotoAlbum(id, album);
        this.privacy.update((buckets) => {
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
        await this.webService.removePrivacyBucketPhotoAlbum(id, album);
        this.privacy.update((buckets) => {
          if (buckets) {
            return buckets.filter((b) => b.id !== id);
          } else {
            return null;
          }
        });
      }
    }
  }

  protected toggleReorder() {
    this.reorder.update((b) => !b);
  }

  protected async reorderAlbums(event: CdkDragDrop<any, any>) {
    const albums = this.gallery();
    if (!albums) return;

    const now = truncateCurrentDate();
    const updatedAlbums = [...albums];
    moveItemInArray(updatedAlbums, event.previousIndex, event.currentIndex);
    for (let i = 0; i < updatedAlbums.length; i++) {
      const album = Object.assign({}, updatedAlbums[i]);
      album.sort = BigInt(i + 1);
      album.updatedAt = now;
      await this.localStorageService.updatePhotoAlbum(album);
    }
    try {
      await this.syncService.fullSync();
    } catch (e) {
      this.errorService.logError(e);
    }
  }

  protected openAlbum(album: PhotoAlbum) {
    if (this.reorder()) return;

    album = Object.assign({}, album);

    this.privacy.set(null);
    this.loadingPrivacy.set(false);
    this.album.set(album);
    this.description.set(album.description || '');
    this.photoUrls.set(album.photoUrls ? [...album.photoUrls] : []);
    this.deleting.set([]);
  }

  protected goBack() {
    this.album.set(null);
    this.editing.set(false);
  }

  protected async createAlbum(name: string) {
    if (name.length === 0) {
      return;
    }
    const album = makePhotoAlbum(name, this.memberId(), BigInt(this.gallery().length + 1));
    await this.localStorageService.addPhotoAlbum(album);
    this.syncService.fullSync();
    this.openAlbum(album);
  }

  protected async saveAlbum() {
    this.editing.set(false);

    const album = this.album();
    if (!album) return;

    const form = document.getElementById('photoAlbumForm') as HTMLFormElement;
    const formData = new FormData(form);
    const name = formData.get('name')?.toString();

    if (name && name.length > 0) {
      const updated = Object.assign({}, album);
      updated.name = name;
      updated.updatedAt = truncateCurrentDate();

      const newDescription = this.description();
      if (newDescription != null) {
        updated.description = nullableField(newDescription);
      }

      let newPhotoUrls: string[] | null = [...this.photoUrls()];
      newPhotoUrls = newPhotoUrls.filter((_, index) => !this.isDeleting(index));
      this.photoUrls.set(newPhotoUrls);
      if (newPhotoUrls.length === 0) {
        newPhotoUrls = null;
      }
      updated.photoUrls = newPhotoUrls;

      await this.localStorageService.updatePhotoAlbum(updated);
      this.syncService.fullSync();
    }
  }

  protected async deleteAlbum() {
    let album = this.album();
    if (!album) return;

    await this.localStorageService.removePhotoAlbum(album.id, album.remoteId);
    this.syncService.fullSync();
    this.goBack();
  }

  protected addPhoto(url: string) {
    this.photoUrls.update((urls) => [...urls, url]);
  }

  protected movePhoto(index: number, direction: 'up' | 'down') {
    const photoUrls = this.photoUrls();

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= photoUrls.length) return;

    if (this.isDeleting(newIndex)) {
      this.undoPhotoDeletion(newIndex);
      this.deletePhoto(index);
    }

    [photoUrls[index], photoUrls[newIndex]] = [photoUrls[newIndex], photoUrls[index]];
  }

  protected deletePhoto(index: number) {
    this.deleting.update((arr) => {
      if (!arr.includes(index)) {
        return [...arr, index];
      }
      return arr;
    });
  }

  protected undoPhotoDeletion(index: number) {
    this.deleting.update((arr) => arr.filter((i) => i !== index));
  }

  protected isDeleting(index: number): boolean {
    return this.deleting().includes(index);
  }

  protected readonly toColor = toColor;
  protected readonly openDialog = openDialog;
}
