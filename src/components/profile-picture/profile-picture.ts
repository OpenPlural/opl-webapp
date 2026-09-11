import { Component, computed, inject, input } from '@angular/core';
import { SettingsService } from '../../services/SettingsService';
import { BASE_URL } from '../../services/WebService';
import { truncateCurrentDate, truncateDate } from '../../util/DateTruncate';
import { getCdnUrl } from '../../services/model/Cdn';

@Component({
  selector: 'app-profile-picture',
  imports: [],
  templateUrl: './profile-picture.html',
})
export class ProfilePicture {
  private readonly settingsService = inject(SettingsService);

  readonly avatarUrl = input<string | null>(null);
  readonly size = input<string>('w-12');
  readonly fallbackSize = input<string>('fa-2x');
  readonly fallbackIcon = input<string>('fa-user');
  readonly roundPfp = input<boolean>(true);

  protected readonly loadAvatar = computed(() => this.settingsService.settings().loadAvatars);
  protected readonly realAvatarUrl = computed(() => getCdnUrl(this.avatarUrl()));
}
