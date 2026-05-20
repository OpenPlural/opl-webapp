import { Component, effect, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { WebService } from '../../../services/WebService';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { MemberProfilePage } from '../member-profile-page/member-profile-page';
import { Pager } from '../../../components/pager/pager';
import { ToggleIconButton } from '../../../components/toggle-icon-button/toggle-icon-button';
import { Member } from '../../../services/model/Member';
import { PopupPageContainer } from '../../../components/container/popup-page-container/popup-page-container';
import { Loading } from '../../../components/loading/loading';
import { Folder } from '../../../services/model/Folder';
import { ViewedCustomFieldDataValue } from '../../../services/model/Field';
import { FriendMemberCustomFieldsPage } from '../friend-member-custom-fields-page/friend-member-custom-fields-page';
import { compareCustomSort } from '../../../util/CustomSort';

@Component({
  selector: 'app-friend-member-page',
  imports: [
    MemberProfilePage,
    Pager,
    ToggleIconButton,
    PopupPageContainer,
    Loading,
    FriendMemberCustomFieldsPage,
  ],
  templateUrl: './friend-member-page.html',
})
export class FriendMemberPage {
  private readonly route = inject(ActivatedRoute);
  private readonly webService = inject(WebService);

  readonly userId = toSignal(
    this.route.paramMap.pipe(
      map((params) => {
        const userId = params.get('userId');
        return userId ? BigInt(userId) : null;
      }),
    ),
    { initialValue: null },
  );
  readonly memberId = toSignal(
    this.route.paramMap.pipe(
      map((params) => {
        const memberId = params.get('memberId');
        return memberId ? BigInt(memberId) : null;
      }),
    ),
    { initialValue: null },
  );

  protected readonly member = signal<Member | null>(null);
  protected readonly folders = signal<Folder[] | null>(null);
  protected readonly customFields = signal<ViewedCustomFieldDataValue[] | null>(null);
  protected readonly selectedTab = signal<'profile' | 'custom fields'>('profile');

  constructor() {
    effect(() => {
      const userId = this.userId();
      const memberId = this.memberId();
      if (userId && memberId) {
        this.webService.getMemberWithFolders(userId, memberId).then((ext) => {
          this.member.set(ext.member);
          this.folders.set(ext.folders);
        });
      } else {
        this.member.set(null);
        this.folders.set(null);
      }
    });
  }

  protected async showCustomFields() {
    this.selectedTab.set('custom fields');

    const userId = this.userId();
    const memberId = this.memberId();
    const fields = this.customFields();
    if (userId && memberId && fields === null) {
      const fields = await this.webService.getMemberCustomFields(userId, memberId);
      this.customFields.set(fields.sort(compareCustomSort));
    }
  }
}
