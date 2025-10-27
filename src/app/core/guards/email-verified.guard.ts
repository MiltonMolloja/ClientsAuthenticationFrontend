import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

export const emailVerifiedGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.currentUser;

  if (user && user.emailConfirmed) {
    return true;
  }

  router.navigate(['/auth/verify-email']);
  return false;
};
