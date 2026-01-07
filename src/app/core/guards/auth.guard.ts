import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { TokenService } from '@core/services/token.service';
import { catchError, map, of } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const tokenService = inject(TokenService);

  const token = tokenService.getAccessToken();
  const refreshToken = tokenService.getRefreshToken();

  // If token exists and is not expired, allow access
  if (token && !tokenService.isTokenExpired(token)) {
    return true;
  }

  // If token is expired but we have a refresh token, try to refresh
  if (refreshToken) {
    return authService.refreshToken().pipe(
      map((response) => {
        if (response.succeeded && response.accessToken) {
          // Token refreshed successfully, allow access
          return true;
        }
        // Refresh failed, redirect to login
        router.navigate(['/login'], {
          queryParams: { returnUrl: state.url },
        });
        return false;
      }),
      catchError(() => {
        // Error during refresh, redirect to login
        router.navigate(['/login'], {
          queryParams: { returnUrl: state.url },
        });
        return of(false);
      }),
    );
  }

  // No token or refresh token, redirect to login
  router.navigate(['/login'], {
    queryParams: { returnUrl: state.url },
  });
  return false;
};
