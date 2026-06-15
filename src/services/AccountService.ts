import {inject, Injectable, signal, WritableSignal} from '@angular/core';
import {UserInfo} from './model/User';
import {WebService} from './WebService';
import {AccountInfo} from './model/Auth';
import {fromJson, toJson} from '../util/FixedJson';

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
      this._account.set(fromJson(accountInfo));
    }
    this._ready.set(true);
  }

  async login(username: string, password: string): Promise<void> {
    const accountInfo = await this.webService.login(username, password);
    localStorage.setItem('account', toJson(accountInfo));
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
      localStorage.setItem('account', toJson(account));
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
      localStorage.setItem('account', toJson(account));
    }
  }

  updateFriendCodeLocally(friendCode: string) {
    this._account.update((account) => {
      if (account) {
        return {
          ...account,
          friendCode,
        };
      }
      return account;
    });

    const account = this._account();
    if (account) {
      localStorage.setItem('account', toJson(account));
    }
  }
}
