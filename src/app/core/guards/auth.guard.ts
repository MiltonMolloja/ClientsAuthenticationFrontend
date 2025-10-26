import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

// Functional auth guard - will be fully implemented in Part 2
export const authGuard: CanActivateFn = (route, state) => {
  // const authService = inject(AuthService);
  const router = inject(Router);

  // Implementation will be completed in Part 2
  // Will check if user is authenticated
  // If not, redirect to login page

  // Placeholder: allow all for now
  return true;

  // Final implementation will be:
  // if (authService.isAuthenticated()) {
  //   return true;
  // }
  // router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
  // return false;
};
