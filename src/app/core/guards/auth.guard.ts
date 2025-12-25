import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { TokenService } from '@core/services/token.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const tokenService = inject(TokenService);

  const token = tokenService.getAccessToken();

  if (token && !tokenService.isTokenExpired(token)) {
    return true;
  }

  // Save return URL for redirect after login
  router.navigate(['/login'], {
    queryParams: { returnUrl: state.url },
  });
  return false;
};
