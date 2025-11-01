import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenService } from '@core/services/token.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);
  const token = tokenService.getAccessToken();
  const refreshToken = tokenService.getRefreshToken();

  if (token && !req.url.includes('/v1/identity/authentication')) {
    let headers = req.headers.set('Authorization', `Bearer ${token}`);

    // Add Refresh-Token header for sessions endpoints
    if (refreshToken && (req.url.includes('/v1/identity/sessions'))) {
      headers = headers.set('Refresh-Token', refreshToken);
    }

    const cloned = req.clone({ headers });
    return next(cloned);
  }

  return next(req);
};
