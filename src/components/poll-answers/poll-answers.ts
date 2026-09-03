import { Component, computed, inject, input } from '@angular/core';
import { PollAnswer } from '../../services/model/Poll';
import { LocalStorageService } from '../../services/LocalStorageService';
import { Member, MemberId } from '../../services/model/Member';
import { compareCustomSort } from '../../util/CustomSort';

@Component({
  selector: 'app-poll-answers',
  imports: [],
  templateUrl: './poll-answers.html',
  styleUrl: './poll-answers.css',
})
export class PollAnswers {
  private readonly localStorageService = inject(LocalStorageService);

  readonly answers = input.required<PollAnswer[]>();
  readonly filter = input.required<number[]>();
  readonly icons = input.required<string[]>();

  protected readonly filteredAnswers = computed(() => {
    const filter = this.filter().map(n => BigInt(n));
    return this.answers().filter(a => filter.includes(a.answer)).sort((a, b) => {
      if (a.answer < b.answer) return 1;
      if (a.answer > b.answer) return -1;
      const aMember = this.getMember(a.memberId);
      const bMember = this.getMember(b.memberId);
      if (!aMember || !bMember) return 0;
      return compareCustomSort(aMember, bMember);
    });
  });

  protected getMember(memberId: MemberId): Member | undefined {
    return this.localStorageService.members().find(m => m.id === memberId);
  }

  protected getIcon(answer: bigint) {
    const icons = this.icons();
    if (icons.length === 1) return icons[0];
    return icons[Number(answer)];
  }
}
