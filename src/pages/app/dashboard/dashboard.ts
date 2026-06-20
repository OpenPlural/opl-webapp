import { Component, computed, inject } from '@angular/core';
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

@Component({
  selector: 'app-dashboard',
  imports: [NavPageContainer, ProfilePicture, DashboardButton, VerticalCenter, IconButton, TranslatePipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  private readonly accountService = inject(AccountService);
  private readonly localStorageService = inject(LocalStorageService);
  private readonly syncService = inject(SyncService);

  protected readonly username = computed(() => this.accountService.account()?.user.name || null);
  protected readonly avatarUrl = computed(() => this.accountService.account()?.user.avatar || null);
  protected readonly system = computed(() => this.accountService.account()?.user.system || false);
  protected readonly syncPending = computed(() => this.localStorageService.dirty());
  protected readonly syncRunning = computed(() => this.syncService.syncInProgress());

  protected async sync() {
    //if (!this.syncPending() || this.syncRunning()) return;

    await this.syncService.fullSync();
  }

  protected readonly VERSION = VERSION;
}
