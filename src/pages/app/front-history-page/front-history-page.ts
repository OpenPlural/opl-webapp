import { Component, inject, signal, viewChild } from '@angular/core';
import {NavPageContainer} from '../../../components/container/nav-page-container/nav-page-container';
import {Pager} from '../../../components/pager/pager';
import {ToggleIconButton} from '../../../components/toggle-icon-button/toggle-icon-button';
import {FrontHistoryTextualPage} from '../front-history-textual-page/front-history-textual-page';
import { FrontHistoryGraphicalPage } from '../front-history-graphical-page/front-history-graphical-page';
import { openDialog } from '../../../util/CommonFunctions';
import { MemberSelector } from '../../../components/selector/member-selector/member-selector';
import { TranslatePipe } from '@ngx-translate/core';
import { MemberId } from '../../../services/model/Member';
import { makeFrontEntry } from '../../../services/model/Front';
import { truncateDate } from '../../../util/DateTruncate';
import { LocalStorageService } from '../../../services/LocalStorageService';
import { SyncService } from '../../../services/SyncService';
import { ColorPicker } from '../../../components/color-picker/color-picker';

@Component({
  selector: 'app-front-history-page',
  imports: [
    NavPageContainer,
    Pager,
    ToggleIconButton,
    FrontHistoryTextualPage,
    FrontHistoryGraphicalPage,
    MemberSelector,
    TranslatePipe,
  ],
  templateUrl: './front-history-page.html',
})
export class FrontHistoryPage {
  private readonly localStorageService = inject(LocalStorageService);
  private readonly syncService = inject(SyncService);

  private readonly graphicalHistory = viewChild(FrontHistoryGraphicalPage);
  private readonly textualHistory = viewChild(FrontHistoryTextualPage);

  protected readonly selectedTab = signal<'graphical' | 'textual'>('graphical');

  protected readonly createFront = signal<boolean>(false);
  protected readonly createFrontMember = signal<MemberId | null>(null);

  protected async createFrontTime(event: SubmitEvent) {
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const startTime = formData.get('startTime')?.toString().trim();
    const endTime = formData.get('endTime')?.toString().trim();
    form.reset();

    const memberId = this.createFrontMember();
    if (startTime && endTime && memberId) {
      const startTimestamp = Date.parse(startTime);
      const endTimestamp = Date.parse(endTime);
      const now = Date.now();

      if (startTimestamp > endTimestamp || endTimestamp > now) {
        return;
      }

      const startedAt = truncateDate(new Date(startTimestamp));
      const endedAt = truncateDate(new Date(endTimestamp));

      const frontEntry = makeFrontEntry(memberId);
      await this.localStorageService.addFrontEntry({
        ...frontEntry,
        startedAt,
        endedAt,
      });
      await this.syncService.fullSync();
      await this.reloadFrontHistory();
    }
  }

  protected async reloadFrontHistory() {
    await this.graphicalHistory()?.loadFrontHistory();
    await this.textualHistory()?.reloadFrontHistory();
  }

  protected readonly openDialog = openDialog;
}
