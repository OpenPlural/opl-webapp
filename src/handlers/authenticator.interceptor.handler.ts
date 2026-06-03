import {HttpEvent, HttpHandlerFn, HttpRequest} from '@angular/common/http';
import {catchError, EMPTY, Observable, throwError} from 'rxjs';
import {inject} from '@angular/core';
import {Router} from '@angular/router';
import {AccountService} from '../services/AccountService';

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
