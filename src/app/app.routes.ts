import { Routes } from '@angular/router';

export const routes: Routes = [
  // Root redirect to profile
  {
    path: '',
    redirectTo: '/profile',
    pathMatch: 'full'
  },

  // Auth feature - No authentication required
  // Will contain login, register, forgot-password, etc.
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES),
    data: { animation: 'AuthPage' }
  },

  // Profile feature - Authentication required (guard will be added in Part 2)
  {
    path: 'profile',
    loadChildren: () => import('./features/profile/profile.routes').then(m => m.PROFILE_ROUTES),
    // canActivate: [authGuard], // Will be added in Part 2
    data: { animation: 'ProfilePage' }
  },

  // Two-Factor Authentication feature - Authentication required
  {
    path: '2fa',
    loadChildren: () => import('./features/two-factor/two-factor.routes').then(m => m.TWO_FACTOR_ROUTES),
    // canActivate: [authGuard], // Will be added in Part 2
    data: { animation: 'TwoFactorPage' }
  },

  // Admin feature - Authentication required (additional role guard will be added in Part 2)
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES),
    // canActivate: [authGuard, roleGuard], // Will be added in Part 2
    data: { animation: 'AdminPage', requiredRole: 'admin' }
  },

  // Wildcard route - redirect to profile
  {
    path: '**',
    redirectTo: '/profile'
  }
];
