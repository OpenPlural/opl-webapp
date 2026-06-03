import {HttpEvent, HttpHandlerFn, HttpRequest} from '@angular/common/http';
import {catchError, EMPTY, Observable, throwError} from 'rxjs';
import {inject} from '@angular/core';
import {Router} from '@angular/router';
import {AccountService} from '../services/AccountService';
import {ToastService} from '../services/ToastService';
import {TranslateService} from '@ngx-translate/core';

export function authenticatedInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  const translate = inject(TranslateService);
  const accountService = inject(AccountService);
  const toastService = inject(ToastService);

  const account = accountService.account();
  if (account) {
    req = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${account.session.token}${account.session.id}`)
    })
  }

  const router = inject(Router);
  return next(req).pipe(
    catchError(error => {
      if (error.status === 401 && !req.url.endsWith('/auth/delete-account') && !req.url.endsWith('/auth/change-password')) {
        if (router.url !== '/auth/login') {
          const sessionExpiredMessage = translate.instant('session expired');
          toastService.sendToast(sessionExpiredMessage, "alert-warning");

          accountService.logout();
          router.navigate(['auth', 'login']);
          return EMPTY;
        }
      }

      return throwError(() => error);
    })
  );
}
