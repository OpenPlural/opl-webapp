import { Component, computed, inject, signal } from '@angular/core';
import { NavPageContainer } from '../../../components/container/nav-page-container/nav-page-container';
import { openDialog } from '../../../util/CommonFunctions';
import { LocalStorageService } from '../../../services/LocalStorageService';
import { compareDates } from '../../../util/CustomSort';
import { TranslatePipe } from '@ngx-translate/core';
import { CustomFieldId } from '../../../services/model/Field';
import { makePoll, Poll } from '../../../services/model/Poll';
import { Router } from '@angular/router';
import { PollLink } from '../../../components/poll-link/poll-link';

@Component({
  selector: 'app-polls',
  imports: [NavPageContainer, TranslatePipe, PollLink],
  templateUrl: './polls.html',
})
export class Polls {
  private readonly router = inject(Router);
  private readonly localStorageService = inject(LocalStorageService);

  protected readonly polls = computed(() =>
    [...this.localStorageService.polls()].sort((a, b) => compareDates(a.openUntil, b.openUntil)),
  );
  protected readonly hasExpiredPolls = computed(() => {
    const polls = this.localStorageService.polls();
    return polls.some(poll => !this.isOpen(poll));
  });
  protected readonly createCustomPoll = signal<boolean>(false);
  protected readonly optionCount = signal<number>(2);

  protected isOpen(poll: Poll): boolean {
    const now = Date.now();
    const openUntil = Date.parse(poll.openUntil);
    return now < openUntil;
  }

  protected gotoPollEdit(id: CustomFieldId) {
    this.router.navigate(['app', 'poll-edit', id]);
  }

  protected toggleCreateCustomPoll(event: PointerEvent) {
    event.preventDefault();

    this.createCustomPoll.update((b) => !b);
  }

  protected addCustomOption(event: PointerEvent) {
    event.preventDefault();

    this.optionCount.update((n) => n + 1);
    const element = document.createElement('input');
    element.setAttribute('name', `customOption${this.optionCount()}`);
    element.setAttribute('type', 'text');
    element.setAttribute('class', 'input w-full join-item');
    const container = document.getElementById('customOptions')!;
    const button = container.lastChild!;
    container.replaceChild(element, button);
    container.appendChild(button);
  }

  protected async createPoll(event: SubmitEvent) {
    event.preventDefault();

    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const name = formData.get('name')?.toString();
    if (!name) return;

    const allowAbstain = formData.get('allowAbstain')?.toString() === 'on';
    const allowVeto = formData.get('allowVeto')?.toString() === 'on';
    let customOptions: string[] | null = null;
    if (this.createCustomPoll()) {
      customOptions = [];
      for (let i = 1; ; i++) {
        const customOption = formData.get(`customOption${i}`)?.toString();
        if (!customOption) break;
        customOptions.push(customOption);
      }
      customOptions = customOptions.map((opt) => opt.trim()).filter((opt) => opt.length > 0);
    }

    const poll = makePoll(name.trim(), allowAbstain, allowVeto, customOptions);
    await this.localStorageService.addPoll(poll);
    this.gotoPollEdit(poll.id);
  }

  protected resetPollCreationDialog() {
    this.createCustomPoll.set(false);
  }

  protected readonly openDialog = openDialog;
}
