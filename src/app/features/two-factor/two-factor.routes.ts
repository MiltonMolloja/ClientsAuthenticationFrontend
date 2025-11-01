import { Routes } from '@angular/router';

export const TWO_FACTOR_ROUTES: Routes = [
  {
    path: 'setup',
    loadComponent: () => import('./pages/setup-2fa/setup-2fa').then(m => m.Setup2FA)
  },
  // Verify 2FA route will be implemented later
  // {
  //   path: 'verify',
  //   loadComponent: () => import('./pages/verify-2fa/verify-2fa').then(m => m.Verify2FA)
  // }
];
