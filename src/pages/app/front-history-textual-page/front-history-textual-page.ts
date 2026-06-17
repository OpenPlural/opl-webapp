import {Component, inject, OnInit, signal} from '@angular/core';
import {SettingsService} from '../../../services/SettingsService';
import {WebService} from '../../../services/WebService';
import {FrontEntry} from '../../../services/model/Front';
import {Loading} from '../../../components/loading/loading';
import {TranslatePipe} from '@ngx-translate/core';
import {formatDuration} from '../../../util/Duration';
import {MemberListItem} from '../../../components/list-item/member-list-item/member-list-item';
import {Member, MemberId} from '../../../services/model/Member';
import {LocalStorageService} from '../../../services/LocalStorageService';

@Component({
  selector: 'app-front-history-textual-page',
  imports: [
    Loading,
    TranslatePipe,
    MemberListItem
  ],
  templateUrl: './front-history-textual-page.html',
})
export class FrontHistoryTextualPage implements OnInit {
  private readonly localStorageService = inject(LocalStorageService);
  private readonly settingsService = inject(SettingsService);
  private readonly webService = inject(WebService);

  protected readonly frontHistory = signal<FrontEntry[] | null>(null);
  protected readonly page = signal<number>(0);
  protected readonly canLoadMore = signal<boolean>(true);
  protected readonly loadingMore = signal<boolean>(true);

  ngOnInit() {
    if (this.frontHistory() === null) {
      this.loadFrontHistory();
    }
  }

  protected async loadFrontHistory() {
    const page = this.page();

    this.loadingMore.set(true);
    try {
      const frontHistory = await this.webService.getFrontHistory(page);
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

  protected getMember(id: MemberId): Member | undefined {
    return this.localStorageService.members().find(member => member.remoteId === id);
  }

  protected formatDate(date: string): string {
    return this.settingsService.formatDate(new Date(Date.parse(date)), 'DateTime');
  }

  protected getDuration(startedAt: string, endedAt: string): string {
    const start = Date.parse(startedAt);
    const end = Date.parse(endedAt);
    const duration = end - start;
    return formatDuration(duration);
  }
}
