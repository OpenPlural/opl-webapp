import { Component, inject, OnInit, signal } from '@angular/core';
import { NavPageContainer } from '../../../components/container/nav-page-container/nav-page-container';
import { WebService } from '../../../services/WebService';
import { TranslatePipe } from '@ngx-translate/core';
import { nullableField } from '../../../util/NullString';
import { Loading } from '../../../components/loading/loading';
import { PkConfig } from '../../../services/model/PluralKit';
import { SyncService } from '../../../services/SyncService';
import { LocalStorageService } from '../../../services/LocalStorageService';

@Component({
  selector: 'app-pluralkit',
  imports: [NavPageContainer, TranslatePipe, Loading],
  templateUrl: './pluralkit.html',
})
export class Pluralkit implements OnInit {
  private readonly localStorageService = inject(LocalStorageService);
  private readonly syncService = inject(SyncService);
  private readonly webService = inject(WebService);

  protected readonly config = signal<PkConfig | null>(null);
  protected readonly loading = signal<boolean>(false);
  protected readonly loadingType = signal<'save' | 'sync' | null>(null);

  ngOnInit() {
    this.webService.getPkConfig().then((config) => {
      this.config.set(config);
    });
  }

  protected async updatePkConfig(event: SubmitEvent) {
    event.preventDefault();

    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const token = nullableField(formData.get('token')?.toString());
    const displayName = nullableField(formData.get('displayName')?.toString());

    const config = {
      token,
      displayName,
    };

    try {
      this.loadingType.set('save');
      this.loading.set(true);
      await this.webService.updatePkConfig(config);
      this.config.set(config);
    } finally {
      this.loading.set(false);
    }
  }

  protected async sync(direction: 'Push' | 'Pull') {
    try {
      this.loadingType.set('sync');
      this.loading.set(true);
      await this.webService.syncPk(direction);
      this.localStorageService.markDirty();
      await this.syncService.fullSync();
    } finally {
      this.loading.set(false);
    }
  }
}
