import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, switchMap } from 'rxjs/operators';
import { throwError, of } from 'rxjs';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const notificationService = inject(NotificationService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An error occurred';

      if (error.error instanceof ErrorEvent) {
        // Client-side error
        errorMessage = `Error: ${error.error.message}`;
      } else {
        // Server-side error
        switch (error.status) {
          case 401:
            // Unauthorized - try to refresh token only if not already trying to refresh
            if (req.url.includes('/refresh-token') || req.url.includes('/authentication')) {
              // Don't try to refresh if we're already refreshing or logging in
              errorMessage = 'Unauthorized';
              break;
            }
            return authService.refreshToken().pipe(
              switchMap(() => {
                // Retry original request
                return next(req);
              }),
              catchError(() => {
                authService.logout().subscribe();
                router.navigate(['/auth/login']);
                return throwError(() => new Error('Session expired'));
              })
            );
          case 403:
            errorMessage = 'Access forbidden';
            break;
          case 404:
            errorMessage = 'Resource not found';
            break;
          case 429:
            errorMessage = error.error?.message || 'Too many requests';
            break;
          case 500:
            errorMessage = 'Internal server error';
            break;
          default:
            errorMessage = error.error?.message || `Error Code: ${error.status}`;
        }
      }

      notificationService.showError(errorMessage);
      return throwError(() => error);
    })
  );
};
