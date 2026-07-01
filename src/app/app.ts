import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import {NavigationEnd, Router, RouterOutlet} from '@angular/router';
import { LocalStorageService } from '../services/LocalStorageService';
import { TranslatePipe } from '@ngx-translate/core';
import { SyncService } from '../services/SyncService';
import { AccountService } from '../services/AccountService';
import { getLanguages } from './app.config';
import { SettingsService } from '../services/SettingsService';
import { hookOnDataDeletion } from '../util/LocalDataDeletion';
import { ErrorService } from '../services/ErrorService';
import { ToastService } from '../services/ToastService';
import {forgetRememberedPath} from '../util/RememberPath';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TranslatePipe],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  private readonly router = inject(Router);
  private readonly accountService = inject(AccountService);
  private readonly errorService = inject(ErrorService);
  private readonly localStorageService = inject(LocalStorageService);
  private readonly settingsService = inject(SettingsService);
  private readonly syncService = inject(SyncService);
  private readonly toastService = inject(ToastService);

  private readonly storagePersistRequested = signal(false);
  private readonly initialSyncDone = signal(false);
  protected readonly languageSelected = signal(false);

  protected readonly ready = computed(() => this.storagePersistRequested() && this.initialSyncDone() && this.localStorageService.ready());
  protected readonly toasts = computed(() => this.toastService.toasts());

  constructor() {
    hookOnDataDeletion(async () => {
      this.languageSelected.set(false);
    });

    effect(() => {
      const storagePersistRequested = this.storagePersistRequested();
      const localStorageReady = this.localStorageService.ready();
      const accountReady = this.accountService.ready();
      const settingsReady = this.settingsService.ready();
      if (storagePersistRequested && localStorageReady && accountReady && settingsReady) {
        this.initialSync();
      }
    });

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        if (event.url !== '/app/members' && event.url !== '/app/fronters' && event.url !== '/app/custom-front' &&
          !event.url.startsWith('/app/member/') && !event.url.startsWith('/app/folder/') &&
          !event.url.startsWith('/app/friend/')) {
          forgetRememberedPath();
        }
      }
    })
  }

  ngOnInit() {
    this.localStorageService.persistStorage().then(() => {
      this.storagePersistRequested.set(true);
    });

    const lang = localStorage.getItem("languageSelected");
    if (lang && lang === "true") {
      this.languageSelected.set(true);
    }
  }

  private initialSync() {
    if (this.initialSyncDone()) return;
    if (!this.accountService.account()) {
      Promise.resolve().then(() => this.initialSyncDone.set(true));
      return;
    }

    this.syncService.fullSync()
      .then(() => {
        this.initialSyncDone.set(true);
      })
      .catch(err => {
        this.errorService.logError(err);
        this.initialSyncDone.set(true);
      });
  }

  protected chooseLanguage(id: string) {
    this.settingsService.changeLanguage(id);
    localStorage.setItem("languageSelected", "true");
    this.languageSelected.set(true);
  }

  protected readonly getLanguages = getLanguages;
}
