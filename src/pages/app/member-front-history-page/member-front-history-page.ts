import { Component, inject, input, OnInit, signal } from '@angular/core';
import { Member } from '../../../services/model/Member';
import { FrontEntry, makeFrontEntry } from '../../../services/model/Front';
import { WebService } from '../../../services/WebService';
import { Loading } from '../../../components/loading/loading';
import { TranslatePipe } from '@ngx-translate/core';
import { HistoricFrontEntry } from '../../../components/historic-front-entry/historic-front-entry.component';
import { openDialog } from '../../../util/CommonFunctions';
import { truncateDate } from '../../../util/DateTruncate';
import { LocalStorageService } from '../../../services/LocalStorageService';
import { SyncService } from '../../../services/SyncService';

@Component({
  selector: 'app-member-front-history-page',
  imports: [Loading, TranslatePipe, HistoricFrontEntry],
  templateUrl: './member-front-history-page.html',
})
export class MemberFrontHistoryPage implements OnInit {
  private readonly localStorageService = inject(LocalStorageService);
  private readonly syncService = inject(SyncService);
  private readonly webService = inject(WebService);

  readonly member = input.required<Member>();

  protected readonly frontHistory = signal<FrontEntry[] | null>(null);
  protected readonly page = signal<number>(0);
  protected readonly canLoadMore = signal<boolean>(true);
  protected readonly loadingMore = signal<boolean>(true);

  ngOnInit() {
    if (this.frontHistory() === null) {
      this.loadFrontHistory();
    }
  }

  protected async reloadFrontHistory() {
    this.frontHistory.set(null);
    this.page.set(0);
    await this.loadFrontHistory();
  }

  protected async loadFrontHistory() {
    const member = this.member();
    const page = this.page();

    this.loadingMore.set(true);
    try {
      const frontHistory = await this.webService.getMemberFrontHistory(member, page);
      this.canLoadMore.set(frontHistory.length > 0);
      this.frontHistory.update((current) => {
        if (current) {
          return [...current, ...frontHistory];
        } else {
          return frontHistory;
        }
      });
      this.page.set(page + 1);
    } finally {
      this.loadingMore.set(false);
    }
  }

  protected async createFrontTime(event: SubmitEvent) {
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const startTime = formData.get('startTime')?.toString().trim();
    const endTime = formData.get('endTime')?.toString().trim();
    form.reset();

    if (startTime && endTime) {
      const startTimestamp = Date.parse(startTime);
      const endTimestamp = Date.parse(endTime);
      const now = Date.now();

      if (startTimestamp > endTimestamp || endTimestamp > now) {
        return;
      }

      const startedAt = truncateDate(new Date(startTimestamp));
      const endedAt = truncateDate(new Date(endTimestamp));

      const frontEntry = makeFrontEntry(this.member().id);
      await this.localStorageService.addFrontEntry({
        ...frontEntry,
        startedAt,
        endedAt,
      });
      await this.syncService.fullSync();
      await this.reloadFrontHistory();
    }
  }

  protected readonly openDialog = openDialog;
}
