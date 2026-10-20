import { Injectable, signal } from '@angular/core';
import { generateLocalId } from '../util/IdGenerator';

const TOAST_VALIDITY_SUCCESS = 2000;
const TOAST_VALIDITY_FAULTY = 10000;
type ToastType = 'alert-warning' | 'alert-error' | 'alert-success';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _toasts = signal<{ id: bigint; message: string; type: ToastType; validity: number }[]>([]);
  readonly toasts = this._toasts.asReadonly();

  constructor() {
    setInterval(() => {
      const now = Date.now();
      this._toasts.update(toasts => toasts.filter(toast => toast.validity > now));
    }, 100);
  }

  sendToast(message: string, type: ToastType) {
    const id = generateLocalId();
    const validity = Date.now() + (type === 'alert-success' ? TOAST_VALIDITY_SUCCESS : TOAST_VALIDITY_FAULTY);
    this._toasts.update(toasts => [...toasts, { id, message, type, validity }]);
  }

  removeToast(id: bigint) {
    this._toasts.update(toasts => toasts.filter(toast => toast.id !== id));
  }
}
