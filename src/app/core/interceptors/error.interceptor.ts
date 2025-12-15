import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, switchMap, retry } from 'rxjs/operators';
import { throwError, of, timer } from 'rxjs';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';
import { LoggerService } from '@core/services/logger.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const notificationService = inject(NotificationService);
  const router = inject(Router);
  const logger = inject(LoggerService);

  // Retry logic for network errors (not for 4xx/5xx errors)
  const shouldRetry = (error: HttpErrorResponse): boolean => {
    // Only retry on network errors (status 0) or 5xx server errors
    return error.status === 0 || (error.status >= 500 && error.status < 600);
  };

  return next(req).pipe(
    retry({
      count: 2,
      delay: (error: HttpErrorResponse, retryCount: number) => {
        if (!shouldRetry(error)) {
          throw error;
        }
        const delayMs = Math.min(1000 * Math.pow(2, retryCount - 1), 5000);
        logger.warn(`Retrying request (attempt ${retryCount}) after ${delayMs}ms`, {
          url: req.url,
        });
        return timer(delayMs);
      },
    }),
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
              }),
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

      logger.error('HTTP Error', error, { url: req.url, status: error.status });
      notificationService.showError(errorMessage);
      return throwError(() => error);
    }),
  );
};
