import { Component, effect, inject, input, OnInit, signal } from '@angular/core';
import { Member } from '../../../services/model/Member';
import { FrontEntry } from '../../../services/model/Front';
import { WebService } from '../../../services/WebService';
import { Loading } from '../../../components/loading/loading';
import { SettingsService } from '../../../services/SettingsService';
import { TranslatePipe } from '@ngx-translate/core';
import { formatDuration } from '../../../util/Duration';

@Component({
  selector: 'app-member-front-history-page',
  imports: [Loading, TranslatePipe],
  templateUrl: './member-front-history-page.html',
})
export class MemberFrontHistoryPage implements OnInit {
  private readonly settingsService = inject(SettingsService);
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
