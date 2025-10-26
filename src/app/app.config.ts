import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withPreloading, PreloadAllModules, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { provideHttpClient, withInterceptors, withXsrfConfiguration } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    // Zone.js configuration with event coalescing for better performance
    provideZoneChangeDetection({ eventCoalescing: true }),

    // Router configuration with preloading strategy and modern features
    provideRouter(
      routes,
      withPreloading(PreloadAllModules), // Preload all lazy-loaded modules
      withComponentInputBinding(), // Enable binding router data to component inputs
      withViewTransitions() // Enable view transitions API
    ),

    // HTTP Client with XSRF protection
    provideHttpClient(
      withInterceptors([
        // Interceptors will be added here in Part 2:
        // - authInterceptor (for JWT token injection)
        // - errorInterceptor (for global error handling)
        // - loadingInterceptor (for loading state management)
      ]),
      withXsrfConfiguration({
        cookieName: 'XSRF-TOKEN',
        headerName: 'X-XSRF-TOKEN'
      })
    ),

    // Material animations
    provideAnimations(),
  ]
};
