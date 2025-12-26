import {
  HttpInterceptorFn,
  HttpErrorResponse,
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, filter, switchMap, take, finalize } from 'rxjs/operators';
import { TokenService } from '@core/services/token.service';
import { AuthService } from '@core/services/auth.service';
import { LoggerService } from '@core/services/logger.service';

// Estado compartido para manejo de concurrencia
let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

/**
 * URLs que no deben intentar refresh token (evitar loop infinito)
 * - Login: Ya es una petición de autenticación
 * - Refresh Token: Evitar loop infinito si el refresh falla
 * - Register: No requiere autenticación
 * - Revoke Token: Logout en progreso
 * - Forgot/Reset Password: No requiere autenticación
 * - Confirm Email: No requiere autenticación
 */
/**
 * URLs exactas que no deben incluir token de autenticación
 * Estas son rutas públicas que no requieren autenticación
 */
const EXCLUDED_URL_PATTERNS = [
  '/v1/identity/authentication', // Login
  '/v1/identity/refresh-token', // Refresh token (usa refresh token, no access token)
  '/v1/identity/revoke-token', // Logout
  '/v1/identity/forgot-password', // Forgot password (público)
  '/v1/identity/reset-password', // Reset password (usa token del email)
  '/v1/identity/confirm-email', // Confirm email (usa token del email)
  '/v1/identity/resend-email-confirmation', // Resend confirmation (público)
];

/**
 * URL exacta para registro (POST /v1/identity)
 * Se verifica por separado porque es exacta, no un prefijo
 */
const REGISTER_URL_PATTERN = /\/v1\/identity\/?$/;

/**
 * Verifica si la URL debe ser excluida del manejo de refresh
 */
function isExcludedUrl(url: string): boolean {
  // Check if it's the register endpoint (exact match)
  if (REGISTER_URL_PATTERN.test(url)) {
    return true;
  }
  // Check other excluded patterns
  return EXCLUDED_URL_PATTERNS.some((excluded) => url.includes(excluded));
}

/**
 * Agrega el token de autorización a la petición
 */
function addTokenToRequest(
  request: HttpRequest<unknown>,
  token: string | null,
  refreshToken?: string | null,
): HttpRequest<unknown> {
  if (!token) return request;

  let headers = request.headers.set('Authorization', `Bearer ${token}`);

  // Add Refresh-Token header for sessions endpoints
  if (refreshToken && request.url.includes('/v1/identity/sessions')) {
    headers = headers.set('Refresh-Token', refreshToken);
  }

  return request.clone({ headers });
}

/**
 * Maneja el error 401 intentando renovar el token
 */
function handle401Error(
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService,
  tokenService: TokenService,
  router: Router,
  logger: LoggerService,
): Observable<HttpEvent<unknown>> {
  logger.warn('⚠️ Token expirado (401), intentando renovar...', {
    url: request.url,
    method: request.method,
  });

  // Si ya estamos refrescando, encolar esta petición
  if (isRefreshing) {
    logger.debug('⏳ Refresh en progreso, encolando petición', {
      url: request.url,
    });

    return refreshTokenSubject.pipe(
      filter((token): token is string => token !== null),
      take(1),
      switchMap((token) => {
        logger.debug('✅ Token renovado, reintentando petición encolada', {
          url: request.url,
        });
        const refreshToken = tokenService.getRefreshToken();
        return next(addTokenToRequest(request, token, refreshToken));
      }),
    );
  }

  // Verificar si hay refresh token disponible
  const refreshToken = tokenService.getRefreshToken();
  if (!refreshToken) {
    logger.error('❌ No hay refresh token disponible, cerrando sesión');
    authService.logout(false).subscribe();
    router.navigate(['/login']);
    return throwError(() => new Error('No refresh token available'));
  }

  // Iniciar proceso de refresh
  isRefreshing = true;
  refreshTokenSubject.next(null);

  logger.info('🔄 Iniciando renovación de token...');

  return authService.refreshToken().pipe(
    switchMap((response) => {
      if (response.succeeded && response.accessToken) {
        const newToken = response.accessToken;
        const newRefreshToken = response.refreshToken || refreshToken;
        logger.info('✅ Token renovado exitosamente');

        refreshTokenSubject.next(newToken);
        return next(addTokenToRequest(request, newToken, newRefreshToken));
      }

      // Refresh no exitoso
      logger.error('❌ Renovación de token falló (succeeded=false)');
      authService.logout(false).subscribe();
      router.navigate(['/login']);
      return throwError(() => new Error('Token refresh failed'));
    }),
    catchError((error) => {
      // Error en refresh, limpiar y redirigir
      logger.error('❌ Error al renovar token', {
        error: error.message || error,
        status: error.status,
      });

      authService.logout(false).subscribe();
      router.navigate(['/login']);
      return throwError(() => error);
    }),
    finalize(() => {
      isRefreshing = false;
      logger.debug('🏁 Proceso de refresh finalizado');
    }),
  );
}

/**
 * Interceptor de autenticación con renovación automática de token
 *
 * Características:
 * - Agrega JWT token a las peticiones
 * - Agrega Refresh-Token header para endpoints de sesiones
 * - Detecta errores 401 (token expirado)
 * - Intenta renovar el token automáticamente usando refresh token
 * - Maneja concurrencia: múltiples peticiones 401 solo generan 1 refresh
 * - Reintenta las peticiones originales con el nuevo token
 * - Si el refresh falla, limpia la sesión y redirige al login
 * - Evita loops infinitos excluyendo URLs de autenticación
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);
  const authService = inject(AuthService);
  const router = inject(Router);
  const logger = inject(LoggerService);

  // No interceptar URLs de autenticación (evitar loop infinito)
  if (isExcludedUrl(req.url)) {
    logger.debug('⏭️ URL excluida del interceptor de auth', {
      url: req.url,
    });
    return next(req);
  }

  // Agregar token si existe
  const token = tokenService.getAccessToken();
  const refreshToken = tokenService.getRefreshToken();
  const authReq = addTokenToRequest(req, token, refreshToken);

  if (token) {
    logger.debug('🔑 Token agregado a la petición', {
      url: req.url,
      method: req.method,
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Solo manejar errores 401 (Unauthorized)
      if (error.status === 401) {
        return handle401Error(req, next, authService, tokenService, router, logger);
      }

      // Otros errores pasan al siguiente interceptor
      return throwError(() => error);
    }),
  );
};
