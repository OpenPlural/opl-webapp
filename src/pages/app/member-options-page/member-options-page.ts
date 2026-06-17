import { Component, computed, inject, input, output, signal } from '@angular/core';
import { Member } from '../../../services/model/Member';
import { ToggleSetting } from '../../../components/toggle-setting/toggle-setting';
import { PrivacyBucketId, SimplePrivacyBucket } from '../../../services/model/Privacy';
import { WebService } from '../../../services/WebService';
import { PrivacyBucketList } from '../../../components/privacy-bucket-list/privacy-bucket-list';
import { TranslatePipe } from '@ngx-translate/core';
import { SettingsService } from '../../../services/SettingsService';

@Component({
  selector: 'app-member-options-page',
  imports: [ToggleSetting, PrivacyBucketList, TranslatePipe],
  templateUrl: './member-options-page.html',
})
export class MemberOptionsPage {
  private readonly settingsService = inject(SettingsService);
  private readonly webService = inject(WebService);

  readonly member = input.required<Member>();
  readonly updateArchived = output<boolean>();

  protected readonly memberCreationDate = computed(() => this.settingsService.formatDate(Date.parse(this.member().createdAt), 'DateTime'));

  protected readonly privacyIds = computed(() => this.privacy()?.map((bucket) => bucket.id) || []);
  protected readonly privacy = signal<SimplePrivacyBucket[] | null>(null);
  protected readonly loadingPrivacy = signal<boolean>(false);
  protected readonly showCreationDate = signal<boolean>(false);

  protected async loadPrivacy() {
    const member = this.member();
    if (!member.remoteId) return;

    this.loadingPrivacy.set(true);
    const privacy = await this.webService.getMemberPrivacy(member);
    this.privacy.set(privacy);
  }

  protected async updatePrivacy(ids: PrivacyBucketId[]) {
    const member = this.member();
    if (!member.remoteId) return;

    const privacyIds = this.privacyIds();
    for (const id of ids) {
      if (!privacyIds.includes(id)) {
        await this.webService.addPrivacyBucketMember(id, member);
      }
    }
    for (const id of privacyIds) {
      if (!ids.includes(id)) {
        await this.webService.removePrivacyBucketMember(id, member);
      }
    }
    await this.loadPrivacy();
  }
}
