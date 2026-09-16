import { Component, computed, inject, input } from '@angular/core';
import { SettingsService } from '../../services/SettingsService';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-ids',
  imports: [TranslatePipe],
  templateUrl: './ids.html',
})
export class Ids {
  private readonly settingsService = inject(SettingsService);

  readonly object = input.required<{ id: bigint }>();
  readonly extraMargin = input<string>('');

  protected readonly show = computed(() => this.settingsService.settings().showIds);
  protected readonly remoteOnly = computed(() => !('remoteId' in this.object()));
  protected readonly remoteId = computed(() => {
    const object = this.object();
    if ('remoteId' in object) {
      return object['remoteId'] as bigint;
    }
    return null;
  });
}
