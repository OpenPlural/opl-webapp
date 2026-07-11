import {Component, computed, inject, OnInit, signal} from '@angular/core';
import { NavPageContainer } from '../../../components/container/nav-page-container/nav-page-container';
import { ProfilePicture } from '../../../components/profile-picture/profile-picture';
import { AccountService } from '../../../services/AccountService';
import { DashboardButton } from '../../../components/dashboard-button/dashboard-button';
import { VerticalCenter } from '../../../components/vertical-center/vertical-center';
import { LocalStorageService } from '../../../services/LocalStorageService';
import { SyncService } from '../../../services/SyncService';
import { IconButton } from '../../../components/icon-button/icon-button';
import {VERSION} from '../../../environment';
import {TranslatePipe} from '@ngx-translate/core';
import {WebService} from '../../../services/WebService';

@Component({
  selector: 'app-dashboard',
  imports: [NavPageContainer, ProfilePicture, DashboardButton, VerticalCenter, IconButton, TranslatePipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private readonly accountService = inject(AccountService);
  private readonly localStorageService = inject(LocalStorageService);
  private readonly syncService = inject(SyncService);
  private readonly webService = inject(WebService);

  protected readonly update = signal<string | null>(null);
  protected readonly updating = signal<boolean>(false);

  protected readonly username = computed(() => this.accountService.account()?.user.name || null);
  protected readonly avatarUrl = computed(() => this.accountService.account()?.user.avatar || null);
  protected readonly system = computed(() => this.accountService.account()?.user.system || false);
  protected readonly syncPending = computed(() => this.localStorageService.dirty());
  protected readonly syncRunning = computed(() => this.syncService.syncInProgress());

  ngOnInit() {
    this.webService.getNewestVersion()
      .then((version) => {
        if (version !== VERSION) {
          this.update.set(version);
        }
      })
      .catch((_) => {});
  }

  protected async sync() {
    //if (!this.syncPending() || this.syncRunning()) return;

    await this.syncService.fullSync();
  }

  protected async triggerUpdate() {
    this.updating.set(true);
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();

      if (registration) {
        await registration.update();
      }
    }
    window.location.reload();
  }

  protected readonly VERSION = VERSION;
}
