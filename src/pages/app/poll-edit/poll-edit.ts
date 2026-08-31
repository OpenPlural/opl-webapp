import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { EditPageContainer } from '../../../components/container/edit-page-container/edit-page-container';
import { Misrouted } from '../../../components/misrouted/misrouted';
import { PopupConfirm } from '../../../components/popup-confirm/popup-confirm';
import { TranslatePipe } from '@ngx-translate/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { LocalStorageService } from '../../../services/LocalStorageService';
import { SyncService } from '../../../services/SyncService';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { truncateCurrentDate, truncateDate, truncateDateToInputValue } from '../../../util/DateTruncate';
import { openDialog } from '../../../util/CommonFunctions';
import { MarkdownBox } from '../../../components/markdown-box/markdown-box';
import { nullableField } from '../../../util/NullString';

@Component({
  selector: 'app-poll-edit',
  imports: [
    EditPageContainer,
    Misrouted,
    PopupConfirm,
    TranslatePipe,
    MarkdownBox,
  ],
  templateUrl: './poll-edit.html',
})
export class PollEdit implements OnInit {
  private readonly location = inject(Location);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly localStorageService = inject(LocalStorageService);
  private readonly syncService = inject(SyncService);

  readonly id = toSignal(
    this.route.paramMap.pipe(
      map((params) => {
        const id = params.get('id');
        return id ? BigInt(id) : null;
      }),
    ),
    { initialValue: null },
  );
  readonly poll = computed(() => {
    const id = this.id();
    return this.localStorageService.polls().find((p) => p.id === id);
  });
  readonly openUntilInputValue = computed(() => {
    const poll = this.poll();
    if (!poll) return null;
    const openUntil = new Date(Date.parse(poll.openUntil));
    return truncateDateToInputValue(openUntil);
  });

  protected readonly description = signal<string>('');

  ngOnInit() {
    this.description.set(this.poll()?.description || '');
  }

  protected async save() {
    const poll = this.poll();
    if (!poll) return;

    const form = document.getElementById('pollForm') as HTMLFormElement;
    const formData = new FormData(form);
    const name = formData.get('name')?.toString();
    const allowAbstain = formData.get('allowAbstain')?.toString() === 'on';
    const allowVeto = formData.get('allowVeto')?.toString() === 'on';
    const openUntil = formData.get('openUntil')?.toString();

    if (name && name.length > 0 && openUntil && openUntil.length > 0) {
      const updated = Object.assign({}, poll);
      updated.name = name;
      updated.allowAbstain = allowAbstain;
      updated.allowVeto = allowVeto;
      updated.openUntil = truncateDate(new Date(Date.parse(openUntil)));
      updated.updatedAt = truncateCurrentDate();

      const newDescription = this.description();
      if (newDescription != null) {
        updated.description = nullableField(newDescription);
      }

      await this.localStorageService.updatePoll(updated);
      this.syncService.fullSync();
      this.location.back();
    }
  }

  protected async delete() {
    const poll = this.poll();
    if (!poll) return;

    await this.localStorageService.removePoll(poll.id, poll.remoteId);
    this.syncService.fullSync();
    this.router.navigate(['app', 'polls']);
  }

  protected readonly openDialog = openDialog;
}
