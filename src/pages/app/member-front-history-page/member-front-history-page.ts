import { Component, inject, input, OnInit, signal } from '@angular/core';
import { Member } from '../../../services/model/Member';
import { FrontEntry } from '../../../services/model/Front';
import { WebService } from '../../../services/WebService';
import { Loading } from '../../../components/loading/loading';
import { TranslatePipe } from '@ngx-translate/core';
import { HistoricFrontEntry } from '../../../components/historic-front-entry/historic-front-entry.component';

@Component({
  selector: 'app-member-front-history-page',
  imports: [Loading, TranslatePipe, HistoricFrontEntry],
  templateUrl: './member-front-history-page.html',
})
export class MemberFrontHistoryPage implements OnInit {
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
}
