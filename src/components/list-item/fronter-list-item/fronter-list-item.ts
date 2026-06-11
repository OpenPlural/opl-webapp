import {
  AfterViewInit,
  Component,
  computed,
  inject,
  input,
  OnDestroy,
  signal,
} from '@angular/core';
import { FrontEntry } from '../../../services/model/Front';
import { LocalStorageService } from '../../../services/LocalStorageService';
import { Router } from '@angular/router';
import { MemberListItem } from '../member-list-item/member-list-item';
import { formatDuration } from '../../../util/Duration';
import { TranslatePipe } from '@ngx-translate/core';
import { truncateCurrentDate } from '../../../util/DateTruncate';
import { SyncService } from '../../../services/SyncService';
import { nullableField } from '../../../util/NullString';

@Component({
  selector: 'app-fronter-list-item',
  imports: [MemberListItem, TranslatePipe],
  templateUrl: './fronter-list-item.html',
})
export class FronterListItem implements AfterViewInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly localStorageService = inject(LocalStorageService);
  private readonly syncService = inject(SyncService);

  private timerId?: number;

  readonly frontEntry = input.required<FrontEntry>();

  protected readonly elapsedTime = signal('');

  protected readonly member = computed(() => {
    const memberId = this.frontEntry().member;
    return this.localStorageService.members().find((m) => m.id === memberId);
  });

  ngAfterViewInit() {
    this.updateTime();
    this.timerId = setInterval(() => this.updateTime(), 500);
  }

  ngOnDestroy() {
    if (this.timerId) {
      clearInterval(this.timerId);
    }
  }

  private updateTime() {
    const startedAt = Date.parse(this.frontEntry().startedAt);
    const now = Date.now();
    const duration = now - startedAt;
    this.elapsedTime.set(formatDuration(duration));
  }

  protected gotoMemberPage() {
    const member = this.member();
    if (!member) return;

    this.router.navigate(['app', 'member', member.id]);
  }

  protected async updateFrontComment(event: Event) {
    const input = event.target as HTMLInputElement;
    const comment = nullableField(input.value);

    const frontEntry = this.frontEntry();
    if (frontEntry.comment === comment) return;

    await this.localStorageService.updateFrontEntry({
      ...frontEntry,
      comment,
      updatedAt: truncateCurrentDate()
    });
    this.syncService.fullSync();
  }
}
