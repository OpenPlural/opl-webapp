import { Component, computed, inject } from '@angular/core';
import { NavPageContainer } from '../../../components/container/nav-page-container/nav-page-container';
import { Pager } from '../../../components/pager/pager';
import { ToggleIconButton } from '../../../components/toggle-icon-button/toggle-icon-button';
import { VerticalCenter } from '../../../components/vertical-center/vertical-center';
import { Router } from '@angular/router';
import { LocalStorageService } from '../../../services/LocalStorageService';
import { FronterListItem } from '../../../components/list-item/fronter-list-item/fronter-list-item';
import {compareCustomSort} from '../../../util/CustomSort';

@Component({
  selector: 'app-fronters',
  imports: [NavPageContainer, Pager, ToggleIconButton, VerticalCenter, FronterListItem],
  templateUrl: './fronters.html',
})
export class Fronters {
  private readonly router = inject(Router);
  private readonly localStorageService = inject(LocalStorageService);

  protected readonly ongoingFront = computed(() => {
    const members = this.localStorageService.members();
    return this.localStorageService.ongoingFront().map((f) => {
      const member = members.find((m) => m.id === f.member);
      return {
        ...f,
        sort: member?.sort || 0n,
        name: member?.name || '',
      };
    }).sort(compareCustomSort);
  });

  protected gotoMembers() {
    this.router.navigate(['app', 'members']);
  }

  protected gotoCustom() {
    this.router.navigate(['app', 'custom-front']);
  }
}
