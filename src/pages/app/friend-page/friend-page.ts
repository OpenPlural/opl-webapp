import {Component, computed, effect, inject, signal} from '@angular/core';
import { PopupPageContainer } from '../../../components/container/popup-page-container/popup-page-container';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { WebService } from '../../../services/WebService';
import { ExtendedUserInfo } from '../../../services/model/User';
import { Pager } from '../../../components/pager/pager';
import { ToggleIconButton } from '../../../components/toggle-icon-button/toggle-icon-button';
import { VerticalCenter } from '../../../components/vertical-center/vertical-center';
import { ProfilePicture } from '../../../components/profile-picture/profile-picture';
import { TranslatePipe } from '@ngx-translate/core';
import { Member, MemberId } from '../../../services/model/Member';
import { MemberListItem } from '../../../components/list-item/member-list-item/member-list-item';
import { MemberFolderView } from '../../../components/member-folder-view/member-folder-view';
import { IconButton } from '../../../components/icon-button/icon-button';
import { Loading } from '../../../components/loading/loading';
import {MarkdownBox} from '../../../components/markdown-box/markdown-box';
import {forgetRememberedPath, getRememberedFriendPath} from '../../../util/RememberPath';
import {compareCustomSort} from '../../../util/CustomSort';

@Component({
  selector: 'app-friend-page',
  imports: [
    PopupPageContainer,
    Pager,
    ToggleIconButton,
    VerticalCenter,
    ProfilePicture,
    TranslatePipe,
    MemberListItem,
    MemberFolderView,
    IconButton,
    Loading,
    MarkdownBox,
  ],
  templateUrl: './friend-page.html',
})
export class FriendPage {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly webService = inject(WebService);

  protected readonly user = signal<ExtendedUserInfo | null>(null);
  protected readonly selectedTab = signal<'account' | 'members'>('account');
  protected readonly searchQuery = signal<string | null>(null);
  protected readonly searchArchived = signal<boolean>(false);

  protected readonly fronters = computed(() => {
    const user = this.user();
    if (!user || !user.members || !user.front) return [];

    return user.front.map((f) => {
      const member = user.members!.find((m) => m.id === f.member);
      return {
        ...f,
        sort: member?.sort || 0n,
        name: member?.name || '',
      };
    }).sort(compareCustomSort);
  });

  readonly id = toSignal(
    this.route.paramMap.pipe(
      map((params) => {
        const id = params.get('id');
        return id ? BigInt(id) : null;
      }),
    ),
    { initialValue: null },
  );

  constructor() {
    effect(() => {
      const id = this.id();
      if (id) {
        this.webService.getUser(id).then((user) => {
          const rememberedPath = getRememberedFriendPath(id);
          if (rememberedPath !== null) {
            this.selectedTab.set('members');
          }
          this.user.set(user);
        });
      } else {
        this.user.set(null);
      }
    });
  }

  protected gotoTab(tab: 'account' | 'members') {
    forgetRememberedPath();
    this.selectedTab.set(tab);
  }

  protected findMember(user: ExtendedUserInfo, memberId: MemberId): Member | undefined {
    return user.members?.find((member) => member.id === memberId);
  }

  protected gotoMemberPage(memberId: MemberId) {
    this.router.navigate(['app', 'friend', this.id(), 'member', memberId]);
  }

  protected gotoFriendSettings() {
    this.router.navigate(['app', 'friend', this.id(), 'settings']);
  }

  protected toggleSearchArchived() {
    this.searchArchived.update((b) => !b);
  }
}
