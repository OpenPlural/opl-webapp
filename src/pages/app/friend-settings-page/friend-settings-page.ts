import { Component, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { WebService } from '../../../services/WebService';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { FriendSettings } from '../../../services/model/Friend';
import { PrivacyBucketId, SimplePrivacyBucket } from '../../../services/model/Privacy';
import { Loading } from '../../../components/loading/loading';
import { TranslatePipe } from '@ngx-translate/core';
import { PopupConfirm } from '../../../components/popup-confirm/popup-confirm';
import { EditPageContainer } from '../../../components/container/edit-page-container/edit-page-container';
import { Location } from '@angular/common';
import { toColor } from '../../../util/ColorConvert';
import { PrivacyBucketList } from '../../../components/privacy-bucket-list/privacy-bucket-list';

@Component({
  selector: 'app-friend-settings-page',
  imports: [Loading, TranslatePipe, PopupConfirm, EditPageContainer, PrivacyBucketList],
  templateUrl: './friend-settings-page.html',
})
export class FriendSettingsPage {
  private readonly location = inject(Location);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly webService = inject(WebService);

  protected readonly username = signal<string | null>(null);

  protected readonly permissionLevel = signal<number | null>(null);
  protected readonly notifyMe = signal<boolean | null>(null);
  protected readonly notifyWithTag = signal<boolean | null>(null);

  readonly privacy = signal<SimplePrivacyBucket[] | null>(null);

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
        this.webService.getUsername(id).then((username) => {
          this.username.set(username);
        });
        this.webService.getFriendSettings(id).then((settings: FriendSettings) => {
          this.permissionLevel.set(parseInt(settings.permissionLevel.toString()));
          this.notifyMe.set(settings.notifyMe);
          this.notifyWithTag.set(settings.notifyWithTag);
        });
        this.loadPrivacy();
      } else {
        this.username.set(null);
        this.privacy.set(null);

        this.permissionLevel.set(null);
        this.notifyMe.set(null);
        this.notifyWithTag.set(null);
      }
    });
  }

  protected async loadPrivacy() {
    const id = this.id();
    if (!id) return;

    const privacy = await this.webService.getFriendPrivacy(id);
    this.privacy.set(privacy);
  }

  protected async updatePrivacy(ids: PrivacyBucketId[]) {
    const folderId = this.id();
    if (!folderId) return;

    const privacyIds = this.privacy()?.map((bucket) => bucket.id) || [];
    for (const id of ids) {
      if (!privacyIds.includes(id)) {
        await this.webService.addPrivacyBucketFriend(id, folderId);
      }
    }
    for (const id of privacyIds) {
      if (!ids.includes(id)) {
        await this.webService.removePrivacyBucketFriend(id, folderId);
      }
    }
    await this.loadPrivacy();
  }

  protected async save() {
    const id = this.id();
    if (!id) return;

    const permissionLevel = this.permissionLevel();
    if (permissionLevel === null) return;

    const notifyMe = this.notifyMe();
    if (notifyMe === null) return;

    const notifyWithTag = this.notifyWithTag();
    if (notifyWithTag === null) return;

    const settings: FriendSettings = {
      permissionLevel: BigInt(permissionLevel),
      notifyMe,
      notifyWithTag,
    };
    await this.webService.updateFriendSettings(id, settings);
    this.location.back();
  }

  protected permissionLevelChanged(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.type === 'checkbox') {
      const permissionLevel = parseInt(input.name);
      if (input.checked) {
        this.permissionLevel.set(permissionLevel);
      } else {
        this.permissionLevel.set(permissionLevel - 1);
      }
    } else if (input.type === 'range') {
      this.permissionLevel.set(parseInt(input.value));
    }
  }

  protected notifyMeChanged(event: Event) {
    const input = event.target as HTMLInputElement;
    this.notifyMe.set(input.checked);
    if (!input.checked) {
      this.notifyWithTag.set(false);
    }
  }

  protected notifyWithTagChanged(event: Event) {
    const input = event.target as HTMLInputElement;
    this.notifyWithTag.set(input.checked);
    if (input.checked) {
      this.notifyMe.set(true);
    }
  }

  protected async unfriend() {
    const id = this.id();
    if (id) {
      await this.webService.unfriend(id);
      this.router.navigate(['app', 'friends']);
    }
  }

  protected readonly toColor = toColor;
  protected readonly open = open;
}
