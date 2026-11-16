import {inject, Injectable} from '@angular/core';
import {SwPush} from '@angular/service-worker';
import {NativeService} from './NativeService';
import {WebService} from './WebService';
import {firstValueFrom} from 'rxjs';

@Injectable({providedIn: 'root'})
export class PushService {
  private readonly swPush = inject(SwPush);
  private readonly nativeService = inject(NativeService);
  private readonly webService = inject(WebService);

  async requestPermissions() {
    if (this.nativeService.isNativeApp()) {
      await this.requestNativePermissions();
    } else {
      await this.requestWebPermissions();
    }
  }

  private async requestNativePermissions() {
    await this.nativeService.requestNotificationPermissions();
    const id = await this.nativeService.subscribeToNotifications();
    if (id) {
      await this.webService.subscribeToNotificationsViaFCM(id);
    }
  }

  private async requestWebPermissions() {
    if (!Notification) {
      return;
    }
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn('Notification permission denied');
        return;
      }
    }
    await this.setupWebPushSubscription();
  }

  private async setupWebPushSubscription() {
    try {
      if (!Notification || Notification.permission !== 'granted') {
        return;
      }

      if (!this.swPush.isEnabled) {
        console.warn('Service Worker Push is not enabled');
        return;
      }

      await navigator.serviceWorker.ready;
      const activeSubscription = await firstValueFrom(this.swPush.subscription);
      if (activeSubscription) {
        await this.swPush.unsubscribe();
      }
      const subscription = await this.swPush.requestSubscription({
        serverPublicKey: 'BP7jwMFFZ4qKgmjFZWCtnU89Xig4rjoLv77qc1bdLyOIZFRYiDNnkGuUFqjiWwC3U_yc0BToPl6XEh6EPoRHc1M'
      });
      await this.webService.subscribeToNotificationsViaWebPush(subscription);
    } catch (e) {
      console.error("Can't subscribe to notifications", e);
    }
  }
}
