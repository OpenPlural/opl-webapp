import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LocalStorageService } from '../services/LocalStorageService';
import { TranslatePipe } from '@ngx-translate/core';
import { SyncService } from '../services/SyncService';
import { AccountService } from '../services/AccountService';
import { getLanguages } from './app.config';
import { SettingsService } from '../services/SettingsService';
import { hookOnDataDeletion } from '../util/LocalDataDeletion';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TranslatePipe],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  private readonly accountService = inject(AccountService);
  private readonly localStorageService = inject(LocalStorageService);
  private readonly settingsService = inject(SettingsService);
  private readonly syncService = inject(SyncService);

  private readonly storagePersistRequested = signal(false);
  private readonly initialSyncDone = signal(false);
  protected readonly initialSyncFailedToast = signal(false);
  protected readonly languageSelected = signal(false);

  protected readonly ready = computed(() => this.storagePersistRequested() && this.initialSyncDone() && this.localStorageService.ready());

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
        console.error("Initial sync failed", err);

        this.initialSyncFailedToast.set(true);
        this.initialSyncDone.set(true);

        setTimeout(() => this.initialSyncFailedToast.set(false), 3000);
      });
  }

  protected chooseLanguage(id: string) {
    this.settingsService.changeLanguage(id);
    localStorage.setItem("languageSelected", "true");
    this.languageSelected.set(true);
  }

  protected readonly getLanguages = getLanguages;
}
