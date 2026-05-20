import { Component, effect, inject, OnInit, signal } from '@angular/core';
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

@Component({
  selector: 'app-privacy-bucket-page',
  imports: [EditPageContainer, PopupConfirm, TranslatePipe, Loading, UserListItem],
  templateUrl: './privacy-bucket-page.html',
})
export class PrivacyBucketPage implements OnInit {
  private readonly location = inject(Location);
  private readonly route = inject(ActivatedRoute);
  private readonly webService = inject(WebService);

  protected readonly bucket = signal<PrivacyBucket | null>(null);
  protected readonly friends = signal<Friend[] | null>(null);

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
        this.webService.getPrivacyBucket(id).then((user) => {
          this.bucket.set(user);
        });
      } else {
        this.bucket.set(null);
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
    const description = formData.get('description')?.toString();
    const emoji = formData.get('emoji')?.toString();

    if (name) {
      const updated = Object.assign({}, bucket);
      updated.name = name;
      updated.description = nullableField(description);
      updated.emoji = nullableField(emoji);

      try {
        await this.webService.updatePrivacyBucket(updated);
      } catch (e) {
        console.error('Failed to update privacy bucket', e);
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
      this.location.back();
    } catch (e) {
      console.error('Failed to delete privacy bucket', e);
    }
  }

  protected readonly openDialog = openDialog;
}
