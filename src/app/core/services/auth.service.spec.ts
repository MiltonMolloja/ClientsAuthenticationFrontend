import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { LoggerService } from './logger.service';
import { environment } from '@environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let tokenService: jasmine.SpyObj<TokenService>;
  let logger: jasmine.SpyObj<LoggerService>;
  let router: jasmine.SpyObj<Router>;

  const mockLoginResponse = {
    succeeded: true,
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    requires2FA: false,
  };

  beforeEach(() => {
    const tokenServiceSpy = jasmine.createSpyObj('TokenService', [
      'setTokens',
      'getAccessToken',
      'getRefreshToken',
      'clearTokens',
      'decodeToken',
      'isTokenExpired',
    ]);
    const loggerSpy = jasmine.createSpyObj('LoggerService', ['debug', 'info', 'warn', 'error']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: TokenService, useValue: tokenServiceSpy },
        { provide: LoggerService, useValue: loggerSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    tokenService = TestBed.inject(TokenService) as jasmine.SpyObj<TokenService>;
    logger = TestBed.inject(LoggerService) as jasmine.SpyObj<LoggerService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    it('should login successfully and set tokens', (done) => {
      service.login({ email: 'test@test.com', password: 'password' }).subscribe((response) => {
        expect(response).toEqual(mockLoginResponse);
        expect(tokenService.setTokens).toHaveBeenCalledWith(
          'mock-access-token',
          'mock-refresh-token',
        );
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/v1/identity/authentication`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        email: 'test@test.com',
        password: 'password',
      });
      req.flush(mockLoginResponse);
    });

    it('should handle login with 2FA required', (done) => {
      const response2FA = { ...mockLoginResponse, requires2FA: true };

      service.login({ email: 'test@test.com', password: 'password' }).subscribe((response) => {
        expect(response).toEqual(response2FA);
        expect(tokenService.setTokens).not.toHaveBeenCalled();
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/v1/identity/authentication`);
      req.flush(response2FA);
    });

    it('should handle login error', (done) => {
      service.login({ email: 'test@test.com', password: 'wrong' }).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(401);
          done();
        },
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/v1/identity/authentication`);
      req.flush({ message: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('register', () => {
    it('should register successfully', (done) => {
      const registerData = {
        email: 'new@test.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      service.register(registerData).subscribe((response) => {
        expect(response.succeeded).toBe(true);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/v1/identity`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(registerData);
      req.flush({ succeeded: true });
    });

    it('should handle registration error (duplicate email)', (done) => {
      const registerData = {
        email: 'existing@test.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      service.register(registerData).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(400);
          done();
        },
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/v1/identity`);
      req.flush({ message: 'Email already exists' }, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('logout', () => {
    it('should logout and clear tokens', (done) => {
      tokenService.getRefreshToken.and.returnValue('mock-refresh-token');

      service.logout().subscribe({
        complete: () => {
          // finalize runs after complete, so we need to wait a tick
          setTimeout(() => {
            expect(tokenService.clearTokens).toHaveBeenCalled();
            expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
            done();
          }, 0);
        },
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/v1/identity/revoke-token`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ refreshToken: 'mock-refresh-token' });
      req.flush({});
    });

    it('should emit logout event to localStorage', (done) => {
      tokenService.getRefreshToken.and.returnValue('mock-refresh-token');
      spyOn(localStorage, 'setItem');
      spyOn(localStorage, 'removeItem');

      // localStorage.setItem is called immediately (before HTTP request)
      service.logout().subscribe({
        complete: () => {
          expect(localStorage.setItem).toHaveBeenCalledWith('auth_logout_event', 'true');
          // removeItem is called after 1000ms timeout, so we just verify setItem was called
          done();
        },
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/v1/identity/revoke-token`);
      req.flush({});
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', (done) => {
      tokenService.getRefreshToken.and.returnValue('mock-refresh-token');
      tokenService.decodeToken.and.returnValue({
        nameid: '123',
        email: 'test@test.com',
        unique_name: 'John',
      });

      service.refreshToken().subscribe((response) => {
        expect(response.succeeded).toBe(true);
        expect(tokenService.setTokens).toHaveBeenCalledWith(
          'new-access-token',
          'new-refresh-token',
        );
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/v1/identity/refresh-token`);
      expect(req.request.method).toBe('POST');
      req.flush({
        succeeded: true,
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });
    });

    it('should handle refresh token failure and logout', (done) => {
      tokenService.getRefreshToken.and.returnValue('expired-refresh-token');

      service.refreshToken().subscribe({
        next: () => fail('should have failed'),
        error: () => {
          expect(tokenService.clearTokens).toHaveBeenCalled();
          expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
          done();
        },
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/v1/identity/refresh-token`);
      req.flush({ message: 'Invalid refresh token' }, { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('2FA operations', () => {
    it('should authenticate with 2FA code', (done) => {
      service.authenticate2FA({ userId: 'user-123', code: '123456' }).subscribe((response) => {
        expect(response.succeeded).toBe(true);
        expect(tokenService.setTokens).toHaveBeenCalled();
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/v1/identity/2fa/authenticate`);
      expect(req.request.method).toBe('POST');
      req.flush(mockLoginResponse);
    });

    it('should enable 2FA', (done) => {
      service.enable2FA().subscribe((response) => {
        expect(response.qrCodeUri).toBeDefined();
        expect(response.secret).toBeDefined();
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/v1/identity/2fa/enable`);
      expect(req.request.method).toBe('POST');
      req.flush({
        succeeded: true,
        qrCodeUri: 'otpauth://...',
        secret: 'ABCD1234',
        backupCodes: ['code1', 'code2'],
      });
    });

    it('should verify 2FA code', (done) => {
      service.verify2FA('123456').subscribe((response) => {
        expect(response.succeeded).toBe(true);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/v1/identity/2fa/verify`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ code: '123456' });
      req.flush({ succeeded: true });
    });

    it('should disable 2FA', (done) => {
      service.disable2FA({ password: 'password', code: '123456' }).subscribe((response) => {
        expect(response.succeeded).toBe(true);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/v1/identity/2fa/disable`);
      expect(req.request.method).toBe('POST');
      req.flush({ succeeded: true });
    });

    it('should get backup codes', (done) => {
      service.getBackupCodes().subscribe((response) => {
        expect(response.backupCodes.length).toBeGreaterThan(0);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/v1/identity/2fa/backup-codes`);
      expect(req.request.method).toBe('GET');
      req.flush({ backupCodes: ['code1', 'code2', 'code3'] });
    });

    it('should regenerate backup codes', (done) => {
      service.regenerateBackupCodes().subscribe((response) => {
        expect(response.backupCodes.length).toBeGreaterThan(0);
        done();
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}/v1/identity/2fa/backup-codes/regenerate`,
      );
      expect(req.request.method).toBe('POST');
      req.flush({ backupCodes: ['new1', 'new2', 'new3'] });
    });
  });

  describe('password management', () => {
    it('should change password', (done) => {
      const request = {
        currentPassword: 'oldPass',
        newPassword: 'newPass123!',
        confirmPassword: 'newPass123!',
      };

      service.changePassword(request).subscribe((response) => {
        expect(response.succeeded).toBe(true);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/v1/identity/change-password`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush({ succeeded: true });
    });

    it('should send forgot password email', (done) => {
      service.forgotPassword({ email: 'test@test.com' }).subscribe((response) => {
        expect(response.succeeded).toBe(true);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/v1/identity/forgot-password`);
      expect(req.request.method).toBe('POST');
      req.flush({ succeeded: true });
    });

    it('should reset password', (done) => {
      const request = {
        email: 'test@test.com',
        token: 'reset-token',
        newPassword: 'newPass123!',
        confirmPassword: 'newPass123!',
      };

      service.resetPassword(request).subscribe((response) => {
        expect(response.succeeded).toBe(true);
        expect(logger.debug).toHaveBeenCalled();
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/v1/identity/reset-password`);
      expect(req.request.method).toBe('POST');
      req.flush({ succeeded: true });
    });
  });

  describe('email confirmation', () => {
    it('should confirm email and refresh token', (done) => {
      tokenService.getRefreshToken.and.returnValue('mock-refresh-token');

      service.confirmEmail({ userId: 'user-123', token: 'confirm-token' }).subscribe((response) => {
        expect(response.succeeded).toBe(true);
        done();
      });

      const confirmReq = httpMock.expectOne(`${environment.apiUrl}/v1/identity/confirm-email`);
      confirmReq.flush({ succeeded: true });

      const refreshReq = httpMock.expectOne(`${environment.apiUrl}/v1/identity/refresh-token`);
      refreshReq.flush(mockLoginResponse);
    });

    it('should resend email confirmation', (done) => {
      service.resendEmailConfirmation('test@test.com').subscribe((response) => {
        expect(response.succeeded).toBe(true);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/v1/identity/resend-email-confirmation`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email: 'test@test.com' });
      req.flush({ succeeded: true });
    });
  });

  describe('profile and sessions', () => {
    it('should update user profile', (done) => {
      tokenService.getAccessToken.and.returnValue('mock-token');
      tokenService.decodeToken.and.returnValue({
        nameid: '123',
        email: 'test@test.com',
        unique_name: 'OldName',
      });

      // First, initialize the currentUser by simulating a login
      // This sets up the currentUserSignal with initial data
      service['loadCurrentUser']();

      service.updateUserProfile('John', 'Doe').subscribe((response) => {
        expect(response.succeeded).toBe(true);
        expect(service.currentUser?.firstName).toBe('John');
        expect(service.currentUser?.lastName).toBe('Doe');
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/v1/identity/profile`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ firstName: 'John', lastName: 'Doe' });
      req.flush({ succeeded: true });
    });

    it('should get sessions', (done) => {
      service.getSessions().subscribe((response) => {
        expect(response.sessions.length).toBeGreaterThan(0);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/v1/identity/sessions`);
      expect(req.request.method).toBe('GET');
      req.flush({ sessions: [{ id: 1, device: 'Chrome' }] });
    });

    it('should revoke session', (done) => {
      service.revokeSession(1).subscribe((response) => {
        expect(response.succeeded).toBe(true);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/v1/identity/sessions/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ succeeded: true });
    });

    it('should revoke all sessions', (done) => {
      service.revokeAllSessions().subscribe((response) => {
        expect(response.succeeded).toBe(true);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/v1/identity/sessions/all`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ succeeded: true });
    });

    it('should get activity log', (done) => {
      service.getActivity(20).subscribe((response) => {
        expect(response.activities.length).toBeGreaterThan(0);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/v1/identity/activity?limit=20`);
      expect(req.request.method).toBe('GET');
      req.flush({ activities: [{ action: 'login', timestamp: new Date() }] });
    });
  });

  describe('authentication state', () => {
    it('should return current user', () => {
      tokenService.getAccessToken.and.returnValue('mock-token');
      tokenService.isTokenExpired.and.returnValue(false);
      tokenService.decodeToken.and.returnValue({
        nameid: '123',
        email: 'test@test.com',
        unique_name: 'John',
      });

      // Trigger checkAuthStatus
      service['checkAuthStatus']();

      expect(service.currentUser).toBeTruthy();
      expect(service.currentUser?.email).toBe('test@test.com');
    });

    it('should return isAuthenticated true when token is valid', () => {
      tokenService.getAccessToken.and.returnValue('mock-token');
      tokenService.isTokenExpired.and.returnValue(false);
      tokenService.decodeToken.and.returnValue({
        nameid: '123',
        email: 'test@test.com',
      });

      service['checkAuthStatus']();

      expect(service.isAuthenticated).toBe(true);
    });

    it('should return isAuthenticated false when no token', () => {
      tokenService.getAccessToken.and.returnValue(null);

      service['checkAuthStatus']();

      expect(service.isAuthenticated).toBe(false);
    });
  });
});
