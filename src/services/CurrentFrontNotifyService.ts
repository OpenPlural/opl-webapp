import {computed, inject, Injectable} from '@angular/core';
import {SettingsService} from './SettingsService';
import {LocalStorageService} from './LocalStorageService';
import {toSignal} from '@angular/core/rxjs-interop';
import {TranslateService} from '@ngx-translate/core';

@Injectable({providedIn: 'root'})
export class CurrentFrontNotifyService {
  private readonly translate = inject(TranslateService);
  private readonly localStorageService = inject(LocalStorageService);
  private readonly settingsService = inject(SettingsService);

  private readonly currentFront = toSignal<string>(this.translate.getStreamOnTranslationChange('front.labels.current'), {
    initialValue: null,
  });

  private readonly frontNames = computed(() => {
    const front = this.localStorageService.ongoingFront();
    const members = this.localStorageService.members();
    return front.map((f) => members.find((m) => m.id === f.member)?.name)
      .filter((s) => s !== undefined)
      .sort((a, b) => a.localeCompare(b));
  });

  async triggerNotificationUpdate() {
    const frontNames = this.frontNames();
    if (frontNames.length > 0) {
      const title = this.currentFront();
      if (!title) return;

      const body = frontNames.join(', ');
      await this.sendNotification(title, body);
    }
  }

  private async sendNotification(title: string, body: string) {
    const settings = this.settingsService.settings();
    if (!settings.currentFrontNotify) return;

    if (!Notification || Notification.permission !== 'granted') return;
    if (!('serviceWorker' in navigator)) return;

    const swr = await navigator.serviceWorker.ready;
    await swr.showNotification(title, {
      body,
      lang: settings.language,
      tag: 'current-front',
      icon: '/icons/icon192.png',
      badge: '/icons/icon-transparent.png',
      data: {
        kind: 'current-front'
      },
      silent: true,
      // @ts-ignore
      renotify: false,
    });
  }
}
