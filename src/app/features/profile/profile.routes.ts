import { Routes } from '@angular/router';

export const PROFILE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/profile/profile').then(m => m.Profile)
  },
  {
    path: 'edit',
    loadComponent: () => import('./pages/edit-profile/edit-profile').then(m => m.EditProfileComponent)
  },
  {
    path: 'change-password',
    loadComponent: () => import('./pages/change-password/change-password').then(m => m.ChangePassword)
  },
  {
    path: 'security',
    loadComponent: () => import('./pages/security-settings/security-settings').then(m => m.SecuritySettings)
  },
  {
    path: 'sessions',
    loadComponent: () => import('./pages/active-sessions/active-sessions').then(m => m.ActiveSessions)
  }
];
