import { inject, Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastService } from './ToastService';
import {fromJson, toJson} from '../util/FixedJson';

@Injectable({ providedIn: 'root' })
export class ErrorService {
  private readonly toastService = inject(ToastService);

  constructor() {
    window.addEventListener('unhandledrejection', (e) => {
      this.logError(e.reason);
    });
    window.addEventListener('error', (e) => {
      this.logError(e.error);
    });
  }

  logError(error: unknown) {
    if (error instanceof HttpErrorResponse) {
      const response = error.error;
      const jsonResponse = typeof response === 'string' ? fromJson(response) : response;
      if (jsonResponse && jsonResponse.kind && jsonResponse.message) {
        const message = `[${jsonResponse.kind}] ${jsonResponse.message}`;
        console.error(message);
        this.logErrorMessage(message);
      } else {
        console.error(error);
        if (error.status !== 504) {
          this.logErrorMessage(`HTTP Error ${error.status} for ${error.url}`);
        }
      }
      return;
    }
    console.error(error);
    if (error instanceof Object && "name" in error && "message" in error && "text" in error) {
      if (error.name === "SyntaxError") {
        this.logErrorMessage(`SNTX: ${error.text}`);
      } else {
        this.logErrorMessage(`${error.name}: ${error.message} (${error.text})`);
      }
    } else if (error instanceof Error) {
      this.logErrorMessage(error.message);
    } else if (error instanceof Object) {
      this.logErrorMessage(toJson(error));
    } else {
      this.logErrorMessage(String(error));
    }
  }

  logErrorMessage(message: string) {
    this.toastService.sendToast(message, 'alert-error');
  }
}
