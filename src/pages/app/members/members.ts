import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { NavPageContainer } from '../../../components/container/nav-page-container/nav-page-container';
import { ToggleIconButton } from '../../../components/toggle-icon-button/toggle-icon-button';
import { LocalStorageService } from '../../../services/LocalStorageService';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Pager } from '../../../components/pager/pager';
import { VerticalCenter } from '../../../components/vertical-center/vertical-center';
import { MemberFolderView } from '../../../components/member-folder-view/member-folder-view';
import { MemberId } from '../../../services/model/Member';

@Component({
  selector: 'app-members',
  imports: [NavPageContainer, ToggleIconButton, Pager, VerticalCenter, MemberFolderView],
  templateUrl: './members.html',
})
export class Members implements OnInit, OnDestroy {
  private readonly localStorageService = inject(LocalStorageService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private subscription = signal<Subscription | null>(null);
  readonly custom = signal(false);

  protected readonly searchQuery = signal<string | null>(null);
  protected readonly searchArchived = signal<boolean>(false);

  protected readonly localMembers = computed(() =>
    this.localStorageService.members().filter((member) => member.custom === this.custom()),
  );
  protected readonly localFolders = computed(() => this.localStorageService.folders());

  ngOnInit() {
    this.subscription.set(
      this.route.data.subscribe((data) => {
        this.custom.set(data['custom']);
      }),
    );
  }

  ngOnDestroy() {
    this.subscription()?.unsubscribe();
  }

  protected gotoMembers() {
    this.router.navigate(['app', 'members']);
  }

  protected gotoFront() {
    this.router.navigate(['app', 'fronters']);
  }

  protected gotoCustom() {
    this.router.navigate(['app', 'custom-front']);
  }

  protected gotoMemberPage(memberId: MemberId) {
    this.router.navigate(['app', 'member', memberId]);
  }

  protected toggleSearchArchived() {
    this.searchArchived.update((b) => !b);
  }
}
