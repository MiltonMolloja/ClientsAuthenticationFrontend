import { HttpInterceptorFn } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

// Functional HTTP interceptor for error handling - will be fully implemented in Part 2
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError(error => {
      // Implementation will be completed in Part 2
      // Will handle different error types:
      // - 401: Unauthorized - redirect to login
      // - 403: Forbidden - show access denied message
      // - 500: Server error - show error notification
      // etc.

      console.error('HTTP Error:', error);
      return throwError(() => error);
    })
  );
};
