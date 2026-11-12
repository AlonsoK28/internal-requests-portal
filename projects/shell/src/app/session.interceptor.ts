import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { SessionStore } from 'shared';
import { catchError, throwError } from 'rxjs';
import { AccessNotice } from './access-notice';

export const sessionInterceptor: HttpInterceptorFn = (request, next) => {
  const session = inject(SessionStore);
  const router = inject(Router);
  const notice = inject(AccessNotice);
  const token = session.token();
  const authenticatedRequest = token
    ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : request;

  return next(authenticatedRequest).pipe(catchError((error: unknown) => {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 401 && !/\/auth\/login(?:\?|$)/.test(request.url)) {
        const currentUrl = router.getCurrentNavigation()?.initialUrl.toString() ?? router.url;
        const currentReturnUrl = router.parseUrl(currentUrl).queryParams['returnUrl'];
        const destination = currentUrl.startsWith('/login') && typeof currentReturnUrl === 'string'
          ? currentReturnUrl : currentUrl;
        session.clear();
        notice.clear();
        void router.navigate(['/login'], { queryParams: { returnUrl: destination } });
      } else if (error.status === 403) {
        notice.deny();
      }
    }
    return throwError(() => error);
  }));
};
