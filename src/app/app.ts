import { Component, computed, effect, inject, isDevMode, OnInit, signal } from '@angular/core';
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
import {CurrentFrontNotifyService} from '../services/CurrentFrontNotifyService';
import {forgetRememberedPath} from '../util/RememberPath';
import { PopupConfirm } from '../components/popup-confirm/popup-confirm';
import { WebService } from '../services/WebService';
import { VERSION } from '../environment';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TranslatePipe, PopupConfirm],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  private readonly router = inject(Router);
  private readonly accountService = inject(AccountService);
  private readonly currentFrontNotifyService = inject(CurrentFrontNotifyService);
  private readonly errorService = inject(ErrorService);
  private readonly localStorageService = inject(LocalStorageService);
  private readonly settingsService = inject(SettingsService);
  private readonly syncService = inject(SyncService);
  private readonly toastService = inject(ToastService);
  private readonly webService = inject(WebService);

  private readonly storagePersistRequested = signal(false);
  private readonly initialSyncDone = signal(false);
  protected readonly languageSelected = signal(false);
  protected readonly update = signal<string | null>(null);
  protected readonly updating = signal(false);

  protected readonly installed = computed(() => !!('serviceWorker' in navigator && navigator.serviceWorker.controller));
  protected readonly ready = computed(() => this.storagePersistRequested() && this.initialSyncDone() && this.localStorageService.ready());
  protected readonly toasts = computed(() => this.toastService.toasts());
  protected readonly languageCode = computed(() => {
    const lang = this.settingsService.settings().language;
    const languages = getLanguages();
    const language = languages.find((l) => l.id === lang);
    if (language && 'code' in language) {
      return language.code as string;
    }
    return;
  });

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
        this.currentFrontNotifyService.triggerNotificationUpdate();
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

    if (!isDevMode()) {
      this.webService.getNewestVersion()
        .then((version) => {
          if (version !== VERSION) {
            this.update.set(version);
          }
        })
        .catch((_) => {});
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

  protected async triggerUpdate() {
    try {
      this.updating.set(true);
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();

        if (registration) {
          await registration.update();

          await new Promise<void>((resolve) => {
            const onControllerChange = () => {
              navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
              resolve();
            };

            navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

            if (registration.waiting) {
              registration.waiting.postMessage({
                type: 'SKIP_WAITING',
              })
            }

            setTimeout(() => {
              navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
              resolve();
            }, 10000);
          });

          await navigator.serviceWorker.ready;
          window.location.reload();
          return;
        }
      }
    } finally {
      this.updating.set(false);
    }
  }

  protected readonly getLanguages = getLanguages;
}
