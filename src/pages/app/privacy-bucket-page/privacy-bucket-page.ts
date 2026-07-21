import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { EditPageContainer } from '../../../components/container/edit-page-container/edit-page-container';
import { PopupConfirm } from '../../../components/popup-confirm/popup-confirm';
import { TranslatePipe } from '@ngx-translate/core';
import { ActivatedRoute } from '@angular/router';
import { WebService } from '../../../services/WebService';
import { PrivacyBucket } from '../../../services/model/Privacy';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { Loading } from '../../../components/loading/loading';
import { nullableField } from '../../../util/NullString';
import { Location } from '@angular/common';
import { Friend } from '../../../services/model/Friend';
import { UserListItem } from '../../../components/list-item/user-list-item/user-list-item';
import { UserId } from '../../../services/model/User';
import { openDialog } from '../../../util/CommonFunctions';
import { ErrorService } from '../../../services/ErrorService';
import {MarkdownBox} from '../../../components/markdown-box/markdown-box';
import { MemberSelector } from '../../../components/selector/member-selector/member-selector';
import { MemberId } from '../../../services/model/Member';
import { LocalStorageService } from '../../../services/LocalStorageService';

@Component({
  selector: 'app-privacy-bucket-page',
  imports: [
    EditPageContainer,
    PopupConfirm,
    TranslatePipe,
    Loading,
    UserListItem,
    MarkdownBox,
    MemberSelector,
  ],
  templateUrl: './privacy-bucket-page.html',
})
export class PrivacyBucketPage implements OnInit {
  private readonly location = inject(Location);
  private readonly route = inject(ActivatedRoute);
  private readonly errorService = inject(ErrorService);
  private readonly localStorageService = inject(LocalStorageService);
  private readonly webService = inject(WebService);

  protected readonly bucket = signal<PrivacyBucket | null>(null);
  protected readonly friends = signal<Friend[] | null>(null);
  protected readonly description = signal<string>('');
  protected readonly assignMembers = signal<boolean>(false);

  protected readonly bucketMembers = computed(() => {
    const bucket = this.bucket();
    if (bucket) {
      return bucket.members;
    }
    return [];
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
        this.webService.getPrivacyBucket(id).then((bucket) => {
          this.bucket.set(bucket);
          this.description.set(bucket.description || '');
        });
      } else {
        this.bucket.set(null);
        this.description.set('');
      }
    });
  }

  ngOnInit() {
    this.webService.getFriends().then((friends) => {
      this.friends.set(friends.sort((a, b) => a.user.name.localeCompare(b.user.name)));
    });
  }

  protected async setFriendSelected(friend: UserId, selected: boolean) {
    const bucket = this.bucket();
    if (!bucket) return;

    if (selected) {
      await this.webService.addPrivacyBucketFriend(bucket.id, friend);
    } else {
      await this.webService.removePrivacyBucketFriend(bucket.id, friend);
    }
  }

  protected async save() {
    const bucket = this.bucket();
    if (!bucket) return;

    const form = document.getElementById('privacyBucketForm') as HTMLFormElement;
    const formData = new FormData(form);
    const name = formData.get('name')?.toString();
    const emoji = formData.get('emoji')?.toString();

    if (name && name.length > 0) {
      const updated = Object.assign({}, bucket);
      updated.name = name;
      updated.emoji = nullableField(emoji);

      const newDescription = this.description();
      if (newDescription != null) {
        updated.description = nullableField(newDescription);
      }

      try {
        await this.webService.updatePrivacyBucket(updated);
      } catch (e) {
        this.errorService.logError(e);
        return;
      }
      this.location.back();
    }
  }

  protected async delete() {
    const id = this.id();
    if (!id) return;

    try {
      await this.webService.deletePrivacyBucket(id);
    } catch (e) {
      this.errorService.logError(e);
      return;
    }
    this.location.back();
  }

  protected async assignBucketMembers(selection: MemberId[]) {
    const bucket = this.bucket();
    if (!bucket) return;

    const currentBucketMembers = this.bucketMembers();
    const addMembers = selection.filter((id) => !currentBucketMembers.includes(id));
    const removeMembers = currentBucketMembers.filter((id) => !selection.includes(id));
    const members = this.localStorageService.members();

    for (const memberId of addMembers) {
      const member = members.find((member) => member.id === memberId);
      if (member) {
        await this.webService.addPrivacyBucketMember(bucket.id, member);
        this.bucket.update((bucket) => {
          if (!bucket) return null;
          return {
            ...bucket,
            members: [...bucket.members, memberId],
          };
        });
      }
    }

    for (const memberId of removeMembers) {
      const member = members.find((member) => member.id === memberId);
      if (member) {
        await this.webService.removePrivacyBucketMember(bucket.id, member);
        this.bucket.update((bucket) => {
          if (!bucket) return null;
          return {
            ...bucket,
            members: bucket.members.filter((member) => member !== memberId),
          };
        });
      }
    }

    this.assignMembers.set(false);
  }

  protected readonly openDialog = openDialog;
}
