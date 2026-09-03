import { Component, computed, effect, inject, signal } from '@angular/core';
import { NavPageContainer } from '../../../components/container/nav-page-container/nav-page-container';
import { Pager } from '../../../components/pager/pager';
import { ToggleIconButton } from '../../../components/toggle-icon-button/toggle-icon-button';
import { VerticalCenter } from '../../../components/vertical-center/vertical-center';
import { DateRange, SelectedDateRange } from '../../../components/date-range/date-range';
import { Analytics as AnalyticsModel } from '../../../services/model/Analytics';
import { WebService } from '../../../services/WebService';
import { Loading } from '../../../components/loading/loading';
import { LocalStorageService } from '../../../services/LocalStorageService';
import { MemberListItem } from '../../../components/list-item/member-list-item/member-list-item';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-analytics',
  imports: [
    NavPageContainer,
    Pager,
    ToggleIconButton,
    VerticalCenter,
    DateRange,
    Loading,
    MemberListItem,
  ],
  templateUrl: './analytics.html',
  styleUrl: './analytics.css',
})
export class Analytics {
  private readonly translate = inject(TranslateService);
  private readonly localStorageService = inject(LocalStorageService);
  private readonly webService = inject(WebService);

  protected readonly selectedTab = signal<'frontCount' | 'frontTime'>('frontCount');
  protected readonly historyRange = signal<SelectedDateRange | null>(null);
  protected readonly analytics = signal<AnalyticsModel | null>(null);
  protected readonly memberData = computed(() => {
    const analytics = this.analytics();
    if (!analytics) return null;

    let members = [...analytics.members];
    const tab = this.selectedTab();
    switch (tab) {
      case 'frontCount':
        members = members.sort((a, b) => Number(b.frontCount - a.frontCount))
          .filter(m => m.frontCount !== 0n);
        break;
      case 'frontTime':
        members = members.sort((a, b) => Number(b.frontMinutes - a.frontMinutes))
          .filter(m => m.frontMinutes !== 0n);
        break;
    }
    return members.map((data) => {
      let hours = Math.floor(Number(data.frontMinutes / 60n));
      const days = Math.floor(hours / 24);
      hours %= 24;

      const frontCountText = this.translate.instant('analytics.labels.frontCount', { count: Number(data.frontCount) });
      const frontTimeText = this.translate.instant('analytics.labels.frontTime', { days, hours });

      const member = this.localStorageService.members().find((m) => m.remoteId === data.id);

      return {
        ...data,
        member,
        frontCountText,
        frontTimeText,
      };
    });
  });

  constructor() {
    effect(() => {
      const range = this.historyRange();
      this.analytics.set(null);
      if (range) {
        this.webService.getAnalytics(range.start, range.end).then((analytics) => {
          this.analytics.set(analytics);
        });
      }
    });
  }

  protected selectTab(tab: 'frontCount' | 'frontTime') {
    this.selectedTab.set(tab);
  }

  protected changeAnalyticsRange(range: SelectedDateRange) {
    this.historyRange.set(range);
  }
}
