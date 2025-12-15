import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';
import { noAuthGuard } from '@core/guards/no-auth.guard';

export const routes: Routes = [
  // Root - Redirect to login
  {
    path: '',
    redirectTo: '/auth/login',
    pathMatch: 'full'
  },

  // Auth feature - No authentication required (redirect if already authenticated)
  // Excepción: logout no tiene guard para permitir cerrar sesión desde cualquier estado
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES),
    data: { animation: 'AuthPage' }
  },

  // Profile feature - Authentication required
  {
    path: 'profile',
    loadChildren: () => import('./features/profile/profile.routes').then(m => m.PROFILE_ROUTES),
    canActivate: [authGuard],
    data: { animation: 'ProfilePage' }
  },

  // Two-Factor Authentication feature - Authentication required
  {
    path: '2fa',
    loadChildren: () => import('./features/two-factor/two-factor.routes').then(m => m.TWO_FACTOR_ROUTES),
    canActivate: [authGuard],
    data: { animation: 'TwoFactorPage' }
  },

  // Admin feature - Authentication required
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES),
    canActivate: [authGuard],
    data: { animation: 'AdminPage', requiredRole: 'admin' }
  },

  // Wildcard route - redirect to login
  {
    path: '**',
    redirectTo: '/auth/login'
  }
];
