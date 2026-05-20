import { inject } from '@angular/core';
import { AccountService } from '../services/AccountService';
import { Router } from '@angular/router';

export const loginGuard = () => {
  return () => {
    const accountService = inject(AccountService);

    if (accountService.account()) {
      return true;
    }

    const router = inject(Router);
    return router.createUrlTree(['auth', 'login']);
  };
};

export const notLoggedInGuard = () => {
  return () => {
    const accountService = inject(AccountService);

    if (accountService.account()) {
      const router = inject(Router);
      return router.createUrlTree(['app']);
    }

    return true;
  };
}
