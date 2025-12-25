import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, retry } from 'rxjs/operators';
import { throwError, timer } from 'rxjs';
import { inject } from '@angular/core';
import { NotificationService } from '@core/services/notification.service';
import { LoggerService } from '@core/services/logger.service';

/**
 * Interceptor de manejo de errores HTTP
 *
 * Características:
 * - Retry automático para errores de red (status 0) y errores 5xx
 * - Exponential backoff para reintentos
 * - Logging estructurado de errores
 * - Notificaciones al usuario para errores
 * - NO maneja 401 (eso lo hace auth.interceptor)
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notificationService = inject(NotificationService);
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
            // 401 is handled by auth.interceptor, don't show notification here
            errorMessage = 'Unauthorized';
            break;
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

      // Don't show notification for 401 (handled by auth.interceptor)
      if (error.status !== 401) {
        notificationService.showError(errorMessage);
      }

      return throwError(() => error);
    }),
  );
};
