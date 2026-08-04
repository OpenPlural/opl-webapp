import { Component, computed, inject, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { formatDuration } from '../../util/Duration';
import { SettingsService } from '../../services/SettingsService';
import { FrontEntry } from '../../services/model/Front';
import { IconButton } from '../icon-button/icon-button';
import { truncateCurrentDate, truncateDate, truncateDateToInputValue } from '../../util/DateTruncate';
import { WebService } from '../../services/WebService';
import { openDialog } from '../../util/CommonFunctions';
import { PopupConfirm } from '../popup-confirm/popup-confirm';
import { SyncService } from '../../services/SyncService';
import { LocalStorageService } from '../../services/LocalStorageService';

@Component({
  selector: 'app-historic-front-entry',
  imports: [TranslatePipe, IconButton, PopupConfirm],
  templateUrl: './historic-front-entry.html',
})
export class HistoricFrontEntry {
  private readonly localStorageService = inject(LocalStorageService);
  private readonly settingsService = inject(SettingsService);
  private readonly syncService = inject(SyncService);
  private readonly webService = inject(WebService);

  readonly frontEntry = input.required<FrontEntry>();
  readonly update = output();

  protected readonly startTimeValue = computed(() => {
    const frontEntry = this.frontEntry();
    const startTime = new Date(Date.parse(frontEntry.startedAt));
    return truncateDateToInputValue(startTime);
  });
  protected readonly endTimeValue = computed(() => {
    const frontEntry = this.frontEntry();
    if (!frontEntry.endedAt) return undefined;
    const endTime = new Date(Date.parse(frontEntry.endedAt));
    return truncateDateToInputValue(endTime);
  });

  protected formatDate(date: string): string {
    return this.settingsService.formatDate(Date.parse(date), 'DateTime');
  }

  protected getDuration(startedAt: string, endedAt: string): string {
    const start = Date.parse(startedAt);
    const end = Date.parse(endedAt);
    const duration = end - start;
    return formatDuration(duration);
  }

  protected async updateFrontTime(event: SubmitEvent) {
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const startTime = formData.get('startTime')?.toString().trim();
    const endTime = formData.get('endTime')?.toString().trim();
    form.reset();

    if (startTime) {
      const now = Date.now();
      const startTimestamp = Date.parse(startTime);

      const startedAt = truncateDate(new Date(startTimestamp));
      let endedAt = null;

      if (this.endTimeValue()) {
        if (!endTime) return;
        const endTimestamp = Date.parse(endTime);
        if (startTimestamp > endTimestamp || endTimestamp > now) {
          return;
        }
        endedAt = truncateDate(new Date(endTimestamp));
      }

      const frontEntry = this.frontEntry();
      await this.webService.updateFrontEntry({
        ...frontEntry,
        startedAt,
        endedAt,
        updatedAt: truncateCurrentDate(),
      }, false);
      if (!endedAt) {
        await this.syncService.fullSync();
      }
      this.update.emit();
    }
  }

  protected async deleteFrontEntry() {
    const frontEntry = this.frontEntry();
    await this.webService.deleteFrontEntry(frontEntry.id);
    if (!frontEntry.endedAt) {
      this.localStorageService.markDirty();
      await this.syncService.fullSync();
    }
    this.update.emit();
  }

  protected readonly openDialog = openDialog;
}
