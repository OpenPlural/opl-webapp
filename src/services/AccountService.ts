import {inject, Injectable, signal, WritableSignal} from '@angular/core';
import {UserInfo} from './model/User';
import {catchError, EMPTY, Observable, throwError} from 'rxjs';
import {HttpEvent, HttpHandlerFn, HttpRequest} from '@angular/common/http';
import {Router} from '@angular/router';
import {WebService} from './WebService';
import {AccountInfo} from './model/Auth';

@Injectable({ providedIn: 'root' })
export class AccountService {
  private readonly _account: WritableSignal<AccountInfo | null> = signal(null);
  private readonly _ready = signal(false);

  readonly account = this._account.asReadonly();
  readonly ready = this._ready.asReadonly();

  private readonly webService = inject(WebService);

  constructor() {
    const accountInfo = localStorage.getItem('account');
    if (accountInfo) {
      this._account.set(JSON.parse(accountInfo));
    }
    this._ready.set(true);
  }

  async login(username: string, password: string): Promise<void> {
    const accountInfo = await this.webService.login(username, password);
    localStorage.setItem('account', JSON.stringify(accountInfo));
    this._account.set(accountInfo);
  }

  logout() {
    localStorage.removeItem('account');
    this._account.set(null);
  }

  updateAccountFromSync(user: UserInfo, friendCode: string) {
    this._account.update((account) => {
      if (account) {
        return {
          ...account,
          user,
          friendCode,
        };
      }
      return account;
    });

    const account = this._account();
    if (account) {
      localStorage.setItem('account', JSON.stringify(account));
    }
  }

  updateAccountLocally(user: UserInfo) {
    this._account.update((account) => {
      if (account) {
        return {
          ...account,
          user,
        };
      }
      return account;
    });

    const account = this._account();
    if (account) {
      localStorage.setItem('account', JSON.stringify(account));
    }
  }
}

export function authenticatedInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  const accountService = inject(AccountService);
  const account = accountService.account();
  if (account) {
    req = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${account.session.token}`)
    })
  }

  const router = inject(Router);
  return next(req).pipe(
    catchError(error => {
      if (error.status === 401 && !req.url.endsWith('/auth/delete-account') && !req.url.endsWith('/auth/change-password')) {
        if (router.url !== '/auth/login') {
          accountService.logout();
          router.navigate(['auth', 'login']);
          return EMPTY;
        }
      }

      return throwError(() => error);
    })
  );
}
