import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import {
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { errorInterceptor } from './error.interceptor';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';
import { LoggerService } from '@core/services/logger.service';
import { of, throwError } from 'rxjs';

describe('errorInterceptor', () => {
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
  let authService: jasmine.SpyObj<AuthService>;
  let notificationService: jasmine.SpyObj<NotificationService>;
  let logger: jasmine.SpyObj<LoggerService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['refreshToken', 'logout']);
    const notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['showError']);
    const loggerSpy = jasmine.createSpyObj('LoggerService', ['error', 'warn']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: NotificationService, useValue: notificationServiceSpy },
        { provide: LoggerService, useValue: loggerSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    notificationService = TestBed.inject(
      NotificationService,
    ) as jasmine.SpyObj<NotificationService>;
    logger = TestBed.inject(LoggerService) as jasmine.SpyObj<LoggerService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('401 Unauthorized', () => {
    it('should refresh token and retry request on 401', (done) => {
      authService.refreshToken.and.returnValue(
        of({ succeeded: true, accessToken: 'new-token', refreshToken: 'new-refresh' }),
      );

      httpClient.get('/api/protected').subscribe({
        next: (response) => {
          expect(response).toEqual({ data: 'success' });
          expect(authService.refreshToken).toHaveBeenCalled();
          done();
        },
      });

      // First request fails with 401
      const req1 = httpMock.expectOne('/api/protected');
      req1.flush(null, { status: 401, statusText: 'Unauthorized' });

      // Retry request succeeds
      const req2 = httpMock.expectOne('/api/protected');
      req2.flush({ data: 'success' });
    });

    it('should logout and redirect on refresh token failure', (done) => {
      authService.refreshToken.and.returnValue(throwError(() => new Error('Refresh failed')));
      authService.logout.and.returnValue(of(void 0));

      httpClient.get('/api/protected').subscribe({
        error: () => {
          expect(authService.refreshToken).toHaveBeenCalled();
          expect(authService.logout).toHaveBeenCalled();
          expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
          done();
        },
      });

      const req = httpMock.expectOne('/api/protected');
      req.flush(null, { status: 401, statusText: 'Unauthorized' });
    });

    it('should not try to refresh on /refresh-token endpoint', (done) => {
      httpClient.post('/v1/identity/refresh-token', {}).subscribe({
        error: () => {
          expect(authService.refreshToken).not.toHaveBeenCalled();
          expect(notificationService.showError).toHaveBeenCalledWith('Unauthorized');
          done();
        },
      });

      const req = httpMock.expectOne('/v1/identity/refresh-token');
      req.flush(null, { status: 401, statusText: 'Unauthorized' });
    });

    it('should not try to refresh on /authentication endpoint', (done) => {
      httpClient.post('/v1/identity/authentication', {}).subscribe({
        error: () => {
          expect(authService.refreshToken).not.toHaveBeenCalled();
          expect(notificationService.showError).toHaveBeenCalledWith('Unauthorized');
          done();
        },
      });

      const req = httpMock.expectOne('/v1/identity/authentication');
      req.flush(null, { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('403 Forbidden', () => {
    it('should show error notification on 403', (done) => {
      httpClient.get('/api/admin').subscribe({
        error: () => {
          expect(notificationService.showError).toHaveBeenCalledWith('Access forbidden');
          expect(logger.error).toHaveBeenCalled();
          done();
        },
      });

      const req = httpMock.expectOne('/api/admin');
      req.flush(null, { status: 403, statusText: 'Forbidden' });
    });
  });

  describe('404 Not Found', () => {
    it('should show error notification on 404', (done) => {
      httpClient.get('/api/notfound').subscribe({
        error: () => {
          expect(notificationService.showError).toHaveBeenCalledWith('Resource not found');
          done();
        },
      });

      const req = httpMock.expectOne('/api/notfound');
      req.flush(null, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('429 Rate Limit', () => {
    it('should show rate limit error message', (done) => {
      httpClient.get('/api/test').subscribe({
        error: () => {
          expect(notificationService.showError).toHaveBeenCalledWith('Too many requests');
          done();
        },
      });

      const req = httpMock.expectOne('/api/test');
      req.flush({ message: 'Too many requests' }, { status: 429, statusText: 'Too Many Requests' });
    });

    it('should show custom rate limit message from server', (done) => {
      httpClient.get('/api/test').subscribe({
        error: () => {
          expect(notificationService.showError).toHaveBeenCalledWith(
            'Rate limit exceeded. Try again in 60 seconds',
          );
          done();
        },
      });

      const req = httpMock.expectOne('/api/test');
      req.flush(
        { message: 'Rate limit exceeded. Try again in 60 seconds' },
        { status: 429, statusText: 'Too Many Requests' },
      );
    });
  });

  describe('500 Internal Server Error', () => {
    it('should show server error notification after retries', fakeAsync(() => {
      let errorReceived = false;

      httpClient.get('/api/test').subscribe({
        error: () => {
          expect(notificationService.showError).toHaveBeenCalledWith('Internal server error');
          errorReceived = true;
        },
      });

      // Initial request fails
      const req1 = httpMock.expectOne('/api/test');
      req1.flush(null, { status: 500, statusText: 'Internal Server Error' });

      // First retry after 1000ms
      tick(1000);
      const req2 = httpMock.expectOne('/api/test');
      req2.flush(null, { status: 500, statusText: 'Internal Server Error' });

      // Second retry after 2000ms
      tick(2000);
      const req3 = httpMock.expectOne('/api/test');
      req3.flush(null, { status: 500, statusText: 'Internal Server Error' });

      expect(errorReceived).toBe(true);
    }));
  });

  describe('Network Errors', () => {
    it('should handle network error (status 0) with retries', fakeAsync(() => {
      let errorReceived = false;

      httpClient.get('/api/test').subscribe({
        error: () => {
          expect(notificationService.showError).toHaveBeenCalled();
          expect(logger.error).toHaveBeenCalled();
          errorReceived = true;
        },
      });

      // Initial request fails
      const req1 = httpMock.expectOne('/api/test');
      req1.error(new ProgressEvent('error'), { status: 0 });

      // First retry
      tick(1000);
      const req2 = httpMock.expectOne('/api/test');
      req2.error(new ProgressEvent('error'), { status: 0 });

      // Second retry
      tick(2000);
      const req3 = httpMock.expectOne('/api/test');
      req3.error(new ProgressEvent('error'), { status: 0 });

      expect(errorReceived).toBe(true);
    }));
  });

  describe('Retry Logic', () => {
    it('should retry on 5xx errors with exponential backoff', fakeAsync(() => {
      let responseReceived = false;

      httpClient.get('/api/test').subscribe({
        next: (response) => {
          expect(response).toEqual({ data: 'success' });
          expect(logger.warn).toHaveBeenCalled();
          responseReceived = true;
        },
      });

      // Initial request fails
      const req1 = httpMock.expectOne('/api/test');
      req1.flush(null, { status: 500, statusText: 'Server Error' });

      // Wait for first retry (1000ms)
      tick(1000);

      // First retry succeeds
      const req2 = httpMock.expectOne('/api/test');
      req2.flush({ data: 'success' });

      expect(responseReceived).toBe(true);
    }));

    it('should NOT retry on 4xx errors', (done) => {
      httpClient.get('/api/test').subscribe({
        error: () => {
          // Should only make one request
          expect(notificationService.showError).toHaveBeenCalledTimes(1);
          done();
        },
      });

      const req = httpMock.expectOne('/api/test');
      req.flush(null, { status: 400, statusText: 'Bad Request' });

      // Verify no additional requests
      httpMock.expectNone('/api/test');
    });
  });

  describe('Error Logging', () => {
    it('should log all HTTP errors', (done) => {
      httpClient.get('/api/test').subscribe({
        error: () => {
          expect(logger.error).toHaveBeenCalledWith(
            'HTTP Error',
            jasmine.any(HttpErrorResponse),
            jasmine.objectContaining({ url: '/api/test', status: 400 }),
          );
          done();
        },
      });

      const req = httpMock.expectOne('/api/test');
      req.flush(null, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('Custom Error Messages', () => {
    it('should use custom error message from server', (done) => {
      httpClient.get('/api/test').subscribe({
        error: () => {
          expect(notificationService.showError).toHaveBeenCalledWith('Custom error from server');
          done();
        },
      });

      const req = httpMock.expectOne('/api/test');
      req.flush(
        { message: 'Custom error from server' },
        { status: 400, statusText: 'Bad Request' },
      );
    });

    it('should use default message when no custom message', (done) => {
      httpClient.get('/api/test').subscribe({
        error: () => {
          expect(notificationService.showError).toHaveBeenCalledWith('Error Code: 418');
          done();
        },
      });

      const req = httpMock.expectOne('/api/test');
      req.flush(null, { status: 418, statusText: "I'm a teapot" });
    });
  });

  describe('Client-side Errors', () => {
    it('should handle client-side errors', fakeAsync(() => {
      let errorReceived = false;

      httpClient.get('/api/test').subscribe({
        error: () => {
          expect(notificationService.showError).toHaveBeenCalledWith(
            jasmine.stringContaining('Error:'),
          );
          errorReceived = true;
        },
      });

      // Initial request fails with client-side error
      const req1 = httpMock.expectOne('/api/test');
      req1.error(new ErrorEvent('Network error', { message: 'Connection failed' }));

      // First retry after 1000ms (status 0 triggers retry)
      tick(1000);
      const req2 = httpMock.expectOne('/api/test');
      req2.error(new ErrorEvent('Network error', { message: 'Connection failed' }));

      // Second retry after 2000ms
      tick(2000);
      const req3 = httpMock.expectOne('/api/test');
      req3.error(new ErrorEvent('Network error', { message: 'Connection failed' }));

      expect(errorReceived).toBe(true);
    }));
  });
});
