import { Component, computed, inject, signal } from '@angular/core';
import { EditPageContainer } from '../../../components/container/edit-page-container/edit-page-container';
import { Misrouted } from '../../../components/misrouted/misrouted';
import { PopupConfirm } from '../../../components/popup-confirm/popup-confirm';
import { PrivacyBucketList } from '../../../components/privacy-bucket-list/privacy-bucket-list';
import { TranslatePipe } from '@ngx-translate/core';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { LocalStorageService } from '../../../services/LocalStorageService';
import { SyncService } from '../../../services/SyncService';
import { WebService } from '../../../services/WebService';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { CUSTOM_FIELD_DATA_TYPES } from '../../../services/model/Field';
import { PrivacyBucketId, SimplePrivacyBucket } from '../../../services/model/Privacy';
import { openDialog } from '../../../util/CommonFunctions';
import { truncateCurrentDate } from '../../../util/DateTruncate';

@Component({
  selector: 'app-custom-field-page',
  imports: [EditPageContainer, Misrouted, PopupConfirm, PrivacyBucketList, TranslatePipe],
  templateUrl: './custom-field-page.html',
})
export class CustomFieldPage {
  private readonly location = inject(Location);
  private readonly route = inject(ActivatedRoute);
  private readonly localStorageService = inject(LocalStorageService);
  private readonly syncService = inject(SyncService);
  private readonly webService = inject(WebService);

  readonly id = toSignal(
    this.route.paramMap.pipe(
      map((params) => {
        const id = params.get('id');
        return id ? BigInt(id) : null;
      }),
    ),
    { initialValue: null },
  );
  readonly customField = computed(() => {
    const id = this.id();
    return this.localStorageService.customFields().find((f) => f.id === id);
  });
  readonly privacyIds = computed(() => this.privacy()?.map((bucket) => bucket.id) || []);
  readonly privacy = signal<SimplePrivacyBucket[] | null>(null);
  readonly loadingPrivacy = signal<boolean>(false);

  protected async loadPrivacy() {
    const customField = this.customField();
    if (!customField || !customField.remoteId) return;

    this.loadingPrivacy.set(true);
    const privacy = await this.webService.getCustomFieldPrivacy(customField);
    this.privacy.set(privacy);
  }

  protected async updatePrivacy(ids: PrivacyBucketId[]) {
    const customField = this.customField();
    if (!customField || !customField.remoteId) return;

    const privacyIds = this.privacyIds();
    for (const id of ids) {
      if (!privacyIds.includes(id)) {
        await this.webService.addPrivacyBucketCustomField(id, customField);
      }
    }
    for (const id of privacyIds) {
      if (!ids.includes(id)) {
        await this.webService.removePrivacyBucketCustomField(id, customField);
      }
    }
    await this.loadPrivacy();
  }

  protected async save() {
    const field = this.customField();
    if (!field) return;

    const form = document.getElementById('customFieldForm') as HTMLFormElement;
    const formData = new FormData(form);
    const name = formData.get('name')?.toString();
    const dataType = formData.get('type')?.toString();

    if (name && dataType) {
      const updated = Object.assign({}, field);
      updated.name = name;
      updated.dataType = dataType;
      updated.updatedAt = truncateCurrentDate();

      await this.localStorageService.updateCustomField(updated);
      this.syncService.fullSync();
      this.location.back();
    }
  }

  protected async delete() {
    const field = this.customField();
    if (!field) return;

    await this.localStorageService.removeCustomField(field.id, field.remoteId);
    this.syncService.fullSync();
    this.location.back();
  }

  protected readonly CUSTOM_FIELD_DATA_TYPES = CUSTOM_FIELD_DATA_TYPES;
  protected readonly openDialog = openDialog;
}
