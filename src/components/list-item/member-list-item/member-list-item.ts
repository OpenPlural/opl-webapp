import { Component, computed, inject, input, output } from '@angular/core';
import { ListItem } from '../list-item/list-item';
import { Member } from '../../../services/model/Member';
import { ProfilePicture } from '../../profile-picture/profile-picture';
import { LocalStorageService } from '../../../services/LocalStorageService';
import { toColor } from '../../../util/ColorConvert';
import { TranslatePipe } from '@ngx-translate/core';
import { VerticalCenter } from '../../vertical-center/vertical-center';
import { makeFrontEntry } from '../../../services/model/Front';
import { SyncService } from '../../../services/SyncService';
import { truncateCurrentDate } from '../../../util/DateTruncate';
import { ErrorService } from '../../../services/ErrorService';

@Component({
  selector: 'app-member-list-item',
  imports: [ListItem, ProfilePicture, TranslatePipe, VerticalCenter],
  templateUrl: './member-list-item.html',
})
export class MemberListItem {
  private readonly errorService = inject(ErrorService);
  private readonly localStorageService = inject(LocalStorageService);
  private readonly syncService = inject(SyncService);

  readonly member = input.required<Member>();
  readonly editable = input.required<boolean>();
  readonly action = output();

  protected readonly cssColor = computed(() => toColor(this.member().color));

  protected readonly fronting = computed(() => {
    const memberId = this.member().id;
    return this.localStorageService.ongoingFront().find((entry) => entry.member === memberId);
  });

  protected async toggleFronting() {
    let frontEntry = this.fronting();
    if (frontEntry) {
      const currentDate = truncateCurrentDate();
      await this.localStorageService.updateFrontEntry({
        ...frontEntry,
        endedAt: currentDate,
        updatedAt: currentDate
      })
    } else {
      await this.localStorageService.addFrontEntry(makeFrontEntry(this.member().id));
    }
    try {
      await this.syncService.fullSync();
    } catch (e) {
      this.errorService.logError(e);
    }
  }
}
