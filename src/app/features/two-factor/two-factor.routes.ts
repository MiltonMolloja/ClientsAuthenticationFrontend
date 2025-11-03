import { Routes } from '@angular/router';

export const TWO_FACTOR_ROUTES: Routes = [
  {
    path: 'setup',
    loadComponent: () => import('./pages/setup-2fa/setup-2fa').then(m => m.Setup2FA)
  },
  {
    path: 'disable',
    loadComponent: () => import('./pages/disable-2fa/disable-2fa').then(m => m.Disable2FA)
  },
  {
    path: 'backup-codes',
    loadComponent: () => import('./pages/backup-codes/backup-codes').then(m => m.BackupCodes)
  },
  // Verify 2FA route will be implemented later
  // {
  //   path: 'verify',
  //   loadComponent: () => import('./pages/verify-2fa/verify-2fa').then(m => m.Verify2FA)
  // }
];
