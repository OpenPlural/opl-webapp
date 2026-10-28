import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class NativeService {
  isNativeApp(): boolean {
    return 'OpenPluralApp' in window;
  }

  getAppVersion(): string | null {
    return this.ifNative((native) => native.getAppVersion());
  }

  private ifNative<T>(callback: (native: any) => T): T | null {
    if (this.isNativeApp()) {
      return callback((window as any).OpenPluralApp);
    } else {
      return null;
    }
  }
}
