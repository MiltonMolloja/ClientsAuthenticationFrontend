import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then(m => m.Login)
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register').then(m => m.Register)
  },
  {
    path: '2fa',
    loadComponent: () => import('./pages/two-factor-auth/two-factor-auth').then(m => m.TwoFactorAuth)
  },
  {
    path: 'callback',
    loadComponent: () => import('./pages/callback/callback').then(m => m.Callback)
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./pages/forgot-password/forgot-password').then(m => m.ForgotPassword)
  },
  {
    path: 'confirm-email',
    loadComponent: () => import('./pages/confirm-email/confirm-email').then(m => m.ConfirmEmail)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./pages/reset-password/reset-password').then(m => m.ResetPassword)
  }
];
