import { HttpInterceptorFn } from '@angular/common/http';

// Functional HTTP interceptor for authentication - will be fully implemented in Part 2
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Implementation will be completed in Part 2
  // Will inject JWT token into requests

  // const authService = inject(AuthService);
  // const token = authService.getAccessToken();

  // if (token) {
  //   req = req.clone({
  //     setHeaders: {
  //       Authorization: `Bearer ${token}`
  //     }
  //   });
  // }

  return next(req);
};
