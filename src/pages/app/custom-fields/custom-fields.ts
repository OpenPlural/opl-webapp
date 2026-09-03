import {Component, computed, inject, signal} from '@angular/core';
import { LocalStorageService } from '../../../services/LocalStorageService';
import { Router } from '@angular/router';
import { NavPageContainer } from '../../../components/container/nav-page-container/nav-page-container';
import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { Loading } from '../../../components/loading/loading';
import { PopupInput } from '../../../components/popup-input/popup-input';
import { compareCustomSort } from '../../../util/CustomSort';
import { VerticalCenter } from '../../../components/vertical-center/vertical-center';
import { CustomFieldId, makeCustomField } from '../../../services/model/Field';
import { TranslatePipe } from '@ngx-translate/core';
import { moveItemInArray } from '@angular/cdk/drag-drop';
import { SyncService } from '../../../services/SyncService';
import { openDialog } from '../../../util/CommonFunctions';
import { ErrorService } from '../../../services/ErrorService';
import {ToggleIconButton} from '../../../components/toggle-icon-button/toggle-icon-button';
import { truncateCurrentDate } from '../../../util/DateTruncate';

@Component({
  selector: 'app-custom-fields',
  imports: [
    NavPageContainer,
    CdkDrag,
    CdkDropList,
    Loading,
    PopupInput,
    VerticalCenter,
    TranslatePipe,
    ToggleIconButton,
  ],
  templateUrl: './custom-fields.html',
  styleUrl: './custom-fields.css',
})
export class CustomFields {
  private readonly router = inject(Router);
  private readonly errorService = inject(ErrorService);
  private readonly localStorageService = inject(LocalStorageService);
  private readonly syncService = inject(SyncService);

  protected readonly reorder = signal<boolean>(false);

  protected readonly customFields = computed(() =>
    [...this.localStorageService.customFields()].sort(compareCustomSort),
  );

  protected toggleReorder() {
    this.reorder.update(b => !b);
  }

  protected gotoCustomField(id: CustomFieldId) {
    this.router.navigate(['app', 'custom-field', id]);
  }

  protected async createCustomField(name: string) {
    const fields = this.customFields();
    if (!fields) return;

    let lastSortId = 0n;
    for (const field of fields) {
      if (field.sort > lastSortId) {
        lastSortId = field.sort;
      }
    }

    const field = makeCustomField(name, lastSortId + 1n);
    await this.localStorageService.addCustomField(field);
    this.gotoCustomField(field.id);
  }

  protected async reorderFields(event: CdkDragDrop<any, any>) {
    const fields = this.customFields();
    if (!fields) return;

    const now = truncateCurrentDate();
    const updatedFields = [...fields];
    moveItemInArray(updatedFields, event.previousIndex, event.currentIndex);
    for (let i = 0; i < updatedFields.length; i++) {
      const field = Object.assign({}, updatedFields[i]);
      field.sort = BigInt(i + 1);
      field.updatedAt = now;
      await this.localStorageService.updateCustomField(field);
    }
    try {
      await this.syncService.fullSync();
    } catch (e) {
      this.errorService.logError(e);
    }
  }

  protected readonly openDialog = openDialog;
}
