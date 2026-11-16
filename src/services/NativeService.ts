import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class NativeService {
  isNativeApp(): boolean {
    return 'OpenPluralApp' in window;
  }

  requestNotificationPermissions(): Promise<void | undefined> {
    return this.ifNativeAsync(async (native) => {
      const code: number = native.requestNotificationPermissions();
      if (code === -1) {
        return;
      }
      while (true) {
        await this.pollWait();
        if (native.isNotificationPermissionsRequestCompleted(code)) {
          return;
        }
      }
    });
  }

  checkNotificationPermissions(): string | undefined {
    return this.ifNative((native) => native.checkNotificationPermissions());
  }

  subscribeToNotifications(): Promise<string | null | undefined> {
    return this.ifNativeAsync(async (native) => {
      if (!native.subscribeToNotifications()) {
        return null;
      }
      while (true) {
        await this.pollWait();
        const id = native.getNotificationSubscriptionId();
        if (id) {
          return id as string;
        }
      }
    });
  }

  notifyCurrentFront(title: string, fronters: string) {
    this.ifNative((native) => native.notifyCurrentFront(title, fronters));
  }

  getAppVersion(): string | undefined {
    return this.ifNative((native) => native.getAppVersion());
  }

  private ifNative<T>(callback: (native: any) => T): T | undefined {
    if (this.isNativeApp()) {
      return callback((window as any).OpenPluralApp);
    } else {
      return undefined;
    }
  }

  private ifNativeAsync<T>(callback: (native: any) => Promise<T>): Promise<T | undefined> {
    if (this.isNativeApp()) {
      return callback((window as any).OpenPluralApp);
    } else {
      return Promise.resolve(undefined);
    }
  }

  private pollWait(): Promise<void> {
    return new Promise<void>((resolve) => {
      setTimeout(resolve, 100);
    });
  }
}
