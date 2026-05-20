import { LocalStorageService } from '../services/LocalStorageService';
import { AccountService } from '../services/AccountService';
import { Router } from '@angular/router';

const hooks: (() => Promise<void>)[] = [];

export function hookOnDataDeletion(listener: () => Promise<void>) {
  hooks.push(listener);
}

export async function deleteLocalData(
  accountService: AccountService,
  localStorageService: LocalStorageService,
  router: Router
) {
  await localStorageService.clear();
  accountService.logout();
  localStorage.clear();

  for (const listener of hooks) {
    await listener();
  }

  await router.navigate(['auth', 'login']);
}
