import { Component, computed, inject, input, OnInit, output, signal } from '@angular/core';
import { LocalStorageService } from '../../../services/LocalStorageService';
import { compareCustomSort } from '../../../util/CustomSort';
import { Selector } from '../selector/selector';
import { MemberListItem } from '../../list-item/member-list-item/member-list-item';
import { MemberId } from '../../../services/model/Member';

@Component({
  selector: 'app-member-selector',
  imports: [Selector, MemberListItem],
  templateUrl: './member-selector.html',
})
export class MemberSelector implements OnInit {
  private readonly localStorageService = inject(LocalStorageService);

  readonly dialogId = input.required<string>();
  readonly title = input.required<string>();
  readonly custom = input<boolean>();
  readonly selection = input<MemberId[]>([]);
  readonly submitSelection = output<MemberId[]>();
  readonly forceClose = output();

  readonly updatedSelection = signal<MemberId[]>([]);

  readonly members = computed(() => {
    const custom = this.custom();
    if (custom === undefined) {
      return this.localStorageService.members().sort((a, b) => {
        if (!a.custom && b.custom) return -1;
        if (a.custom && !b.custom) return 1;
        return compareCustomSort(a, b);
      });
    } else {
      return this.localStorageService.members()
        .filter(member => member.custom === custom)
        .sort(compareCustomSort);
    }
  });

  ngOnInit() {
    this.updatedSelection.set(this.selection());
  }

  protected setSelected(id: MemberId, selected: boolean) {
    if (selected) {
      this.updatedSelection.update((selection) => [...selection, id]);
    } else {
      this.updatedSelection.update((selection) => selection.filter((v) => v !== id));
    }
  }
}
