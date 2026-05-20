import { Component, computed, inject, input } from '@angular/core';
import { SettingsService } from '../../services/SettingsService';

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
}
