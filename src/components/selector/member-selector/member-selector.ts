import { Component, computed, inject, input, OnInit, output, signal } from '@angular/core';
import { LocalStorageService } from '../../../services/LocalStorageService';
import { compareCustomSort } from '../../../util/CustomSort';
import { Selector } from '../selector/selector';
import { MemberListItem } from '../../list-item/member-list-item/member-list-item';
import { MemberId } from '../../../services/model/Member';
import { ToggleIconButton } from '../../toggle-icon-button/toggle-icon-button';

@Component({
  selector: 'app-member-selector',
  imports: [Selector, MemberListItem, ToggleIconButton],
  templateUrl: './member-selector.html',
})
export class MemberSelector implements OnInit {
  private readonly localStorageService = inject(LocalStorageService);

  readonly dialogId = input.required<string>();
  readonly title = input.required<string>();
  readonly custom = input<boolean>();
  readonly frontingFirst = input<boolean>(false);
  readonly selectMultiple = input<boolean>(true);
  readonly selection = input<MemberId[]>([]);
  readonly submitSelection = output<MemberId[]>();
  readonly forceClose = output();

  readonly updatedSelection = signal<MemberId[]>([]);
  readonly showArchived = signal<boolean>(false);

  readonly members = computed(() => {
    const frontingFirst = this.frontingFirst();
    const front = this.localStorageService.ongoingFront();
    const custom = this.custom();
    const showArchived = this.showArchived();
    if (custom === undefined) {
      return this.localStorageService.members()
        .filter((member) => showArchived || !member.archived)
        .sort((a, b) => {
          if (frontingFirst) {
            const aFronting = front.some((entry) => entry.member === a.id);
            const bFronting = front.some((entry) => entry.member === b.id);
            if (aFronting && !bFronting) return -1;
            if (!aFronting && bFronting) return 1;
          }
          if (!a.custom && b.custom) return -1;
          if (a.custom && !b.custom) return 1;
          return compareCustomSort(a, b);
        });
    } else {
      return this.localStorageService.members()
        .filter((member) => showArchived || !member.archived)
        .filter((member) => member.custom === custom)
        .sort((a, b) => {
          if (frontingFirst) {
            const aFronting = front.some((entry) => entry.member === a.id);
            const bFronting = front.some((entry) => entry.member === b.id);
            if (aFronting && !bFronting) return -1;
            if (!aFronting && bFronting) return 1;
          }
          return compareCustomSort(a, b);
        });
    }
  });

  ngOnInit() {
    this.updatedSelection.set(this.selection());
  }

  protected setSelected(id: MemberId, selected: boolean) {
    if (selected) {
      this.updatedSelection.update((selection) => [...selection, id]);
      if (!this.selectMultiple()) {
        this.submitSelection.emit(this.updatedSelection());
      }
    } else {
      this.updatedSelection.update((selection) => selection.filter((v) => v !== id));
    }
  }

  protected toggleShowArchived() {
    this.showArchived.update(b => !b);
  }
}
