import { Injectable, ErrorHandler, inject } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

// Type definitions for Sentry (to avoid importing the full library at startup)
type SeverityLevel = 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug';

interface Breadcrumb {
  type?: string;
  level?: SeverityLevel;
  event_id?: string;
  category?: string;
  message?: string;
  data?: Record<string, unknown>;
  timestamp?: number;
}

interface SentryModule {
  init: (options: Record<string, unknown>) => void;
  captureException: (error: Error, context?: Record<string, unknown>) => void;
  captureMessage: (message: string, context?: Record<string, unknown>) => void;
  setUser: (user: Record<string, unknown> | null) => void;
  addBreadcrumb: (breadcrumb: Breadcrumb) => void;
  setContext: (name: string, context: Record<string, unknown>) => void;
  setTag: (key: string, value: string) => void;
}

/**
 * Sentry Error Tracking Service for Identity/Authentication Frontend
 *
 * Initializes and configures Sentry for production error monitoring.
 * Uses lazy loading to reduce initial bundle size (~50KB savings).
 * In development, errors are logged to console instead.
 */
@Injectable({
  providedIn: 'root',
})
export class SentryService {
  private initialized = false;
  private sentry: SentryModule | null = null;

  /**
   * Initialize Sentry with the configured DSN
   * Uses dynamic import to lazy load Sentry only in production
   */
  async init(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Check if sentry config exists in environment
    const sentryConfig = (environment as Record<string, unknown>)['sentry'] as
      | { enabled: boolean; dsn: string }
      | undefined;

    if (sentryConfig?.enabled && sentryConfig?.dsn) {
      try {
        // Lazy load Sentry only when needed
        const SentryModule = await import('@sentry/angular');
        this.sentry = SentryModule;

        SentryModule.init({
          dsn: sentryConfig.dsn,
          environment: environment.production ? 'production' : 'development',

          // Lower sample rate for auth service (less traffic)
          tracesSampleRate: environment.production ? 0.1 : 1.0,

          // Capture Replay for errors only
          replaysSessionSampleRate: 0,
          replaysOnErrorSampleRate: 1.0,

          // Filter out sensitive data - CRITICAL for auth service
          beforeSend(event) {
            // Remove any PII from the event
            if (event.user) {
              delete event.user.email;
              delete event.user.ip_address;
            }
            // Remove sensitive request data
            if (event.request) {
              delete event.request.cookies;
              if (event.request.headers) {
                delete event.request.headers['Authorization'];
                delete event.request.headers['Cookie'];
              }
            }
            return event;
          },

          // Ignore common non-actionable errors
          ignoreErrors: [
            // Browser extensions
            'top.GLOBALS',
            'canvas.contentDocument',
            // Network errors
            'Network request failed',
            'Failed to fetch',
            'NetworkError',
            'Load failed',
            // User cancellation
            'AbortError',
            'cancelled',
            // Auth-specific errors that are expected
            'Invalid credentials',
            'Session expired',
            'Token expired',
          ],
        });

        this.initialized = true;
        console.log('[Sentry] Initialized successfully');
      } catch (error) {
        console.error('[Sentry] Failed to initialize:', error);
      }
    } else {
      console.log('[Sentry] Disabled - not in production or no DSN configured');
    }
  }

  /**
   * Capture an exception and send to Sentry
   */
  captureException(error: Error, context?: Record<string, unknown>): void {
    const sentryConfig = (environment as Record<string, unknown>)['sentry'] as
      | { enabled: boolean }
      | undefined;

    if (sentryConfig?.enabled && this.initialized && this.sentry) {
      this.sentry.captureException(error, context ? { extra: context } : undefined);
    } else {
      console.error('[Error]', error, context);
    }
  }

  /**
   * Capture a message and send to Sentry
   */
  captureMessage(
    message: string,
    level: SeverityLevel = 'info',
    context?: Record<string, unknown>,
  ): void {
    const sentryConfig = (environment as Record<string, unknown>)['sentry'] as
      | { enabled: boolean }
      | undefined;

    if (sentryConfig?.enabled && this.initialized && this.sentry) {
      const captureContext: { level: SeverityLevel; extra?: Record<string, unknown> } = {
        level,
      };
      if (context) {
        captureContext.extra = context;
      }
      this.sentry.captureMessage(message, captureContext);
    } else {
      console.log(`[${level.toUpperCase()}]`, message, context);
    }
  }

  /**
   * Set user information for error tracking
   * Note: Only set user ID, never email or other PII
   */
  setUser(userId: string | null): void {
    const sentryConfig = (environment as Record<string, unknown>)['sentry'] as
      | { enabled: boolean }
      | undefined;

    if (sentryConfig?.enabled && this.initialized && this.sentry) {
      this.sentry.setUser(userId ? { id: userId } : null);
    }
  }

  /**
   * Add breadcrumb for debugging
   */
  addBreadcrumb(breadcrumb: Breadcrumb): void {
    const sentryConfig = (environment as Record<string, unknown>)['sentry'] as
      | { enabled: boolean }
      | undefined;

    if (sentryConfig?.enabled && this.initialized && this.sentry) {
      this.sentry.addBreadcrumb(breadcrumb);
    }
  }

  /**
   * Set extra context for all future events
   */
  setContext(name: string, context: Record<string, unknown>): void {
    const sentryConfig = (environment as Record<string, unknown>)['sentry'] as
      | { enabled: boolean }
      | undefined;

    if (sentryConfig?.enabled && this.initialized && this.sentry) {
      this.sentry.setContext(name, context);
    }
  }

  /**
   * Set a tag for all future events
   */
  setTag(key: string, value: string): void {
    const sentryConfig = (environment as Record<string, unknown>)['sentry'] as
      | { enabled: boolean }
      | undefined;

    if (sentryConfig?.enabled && this.initialized && this.sentry) {
      this.sentry.setTag(key, value);
    }
  }
}

/**
 * Global Error Handler that integrates with Sentry
 * Extends Angular's ErrorHandler to capture unhandled errors
 */
@Injectable()
export class SentryErrorHandler implements ErrorHandler {
  private sentryService = inject(SentryService);
  private router = inject(Router);

  handleError(error: Error): void {
    // Log to console in development
    console.error('Unhandled error:', error);

    // Capture in Sentry (without sensitive route info for auth pages)
    const route = this.router.url;
    const sanitizedRoute = route.includes('token') ? '[REDACTED]' : route;

    this.sentryService.captureException(error, {
      route: sanitizedRoute,
      timestamp: new Date().toISOString(),
    });
  }
}
