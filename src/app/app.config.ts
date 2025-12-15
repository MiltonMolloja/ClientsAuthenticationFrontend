import {
  ApplicationConfig,
  provideZoneChangeDetection,
  APP_INITIALIZER,
  ErrorHandler,
} from '@angular/core';
import {
  provideRouter,
  withPreloading,
  PreloadAllModules,
  withComponentInputBinding,
  withViewTransitions,
} from '@angular/router';
import { provideHttpClient, withInterceptors, withXsrfConfiguration } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { ThemeService } from '@core/services/theme.service';
import { LanguageService } from '@core/services/language.service';
import { LoggerService } from '@core/services/logger.service';
import { authInterceptor } from '@core/interceptors/auth.interceptor';
import { errorInterceptor } from '@core/interceptors/error.interceptor';
import { GlobalErrorHandler } from '@shared/components/error-boundary/error-boundary';

import { routes } from './app.routes';

// Inicializar ThemeService y LanguageService al arranque de la aplicación
function initializeApp(
  themeService: ThemeService,
  languageService: LanguageService,
  logger: LoggerService,
) {
  return () => {
    // Los servicios se inyectan y sus constructores se ejecutan automáticamente
    logger.info('ThemeService initialized:', themeService.theme());
    logger.info('LanguageService initialized:', languageService.language());
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    // Zone.js configuration with event coalescing for better performance
    provideZoneChangeDetection({ eventCoalescing: true }),

    // Router configuration with preloading strategy and modern features
    provideRouter(
      routes,
      withPreloading(PreloadAllModules), // Preload all lazy-loaded modules
      withComponentInputBinding(), // Enable binding router data to component inputs
      withViewTransitions(), // Enable view transitions API
    ),

    // HTTP Client with interceptors and XSRF protection
    provideHttpClient(
      withInterceptors([authInterceptor, errorInterceptor]),
      withXsrfConfiguration({
        cookieName: 'XSRF-TOKEN',
        headerName: 'X-XSRF-TOKEN',
      }),
    ),

    // Material animations
    provideAnimations(),

    // Global error handler
    {
      provide: ErrorHandler,
      useClass: GlobalErrorHandler,
    },

    // Initialize ThemeService and LanguageService at app startup
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [ThemeService, LanguageService, LoggerService],
      multi: true,
    },
  ],
};
