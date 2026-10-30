import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class NativeService {
  isNativeApp(): boolean {
    return 'OpenPluralApp' in window;
  }

  subscribeToNotifications() {
    this.ifNative((native) => native.subscribeToNotifications());
  }

  checkNotificationPermissions(): string | undefined {
    return this.ifNative((native) => native.checkNotificationPermissions());
  }

  notifyCurrentFront(title: string, fronters: string, sticky: boolean) {
    this.ifNative((native) => native.notifyCurrentFront(title, fronters, sticky));
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
}
