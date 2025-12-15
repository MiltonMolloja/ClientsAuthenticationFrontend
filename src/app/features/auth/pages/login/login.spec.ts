import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { of, throwError, Subject } from 'rxjs';
import { signal } from '@angular/core';
import { Login } from './login';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';
import { LanguageService } from '@core/services/language.service';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: Router;
  let notificationService: jasmine.SpyObj<NotificationService>;

  const setupTestBed = async (queryParams: Record<string, string> = {}) => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['login']);
    const notificationServiceSpy = jasmine.createSpyObj('NotificationService', [
      'showSuccess',
      'showError',
    ]);

    // Create a more complete mock for LanguageService
    const languageServiceMock = {
      t: jasmine.createSpy('t').and.callFake((key: string) => key),
      getLanguageName: jasmine.createSpy('getLanguageName').and.returnValue('Español'),
      language: signal('es'),
      setLanguage: jasmine.createSpy('setLanguage'),
      toggleLanguage: jasmine.createSpy('toggleLanguage'),
    };

    await TestBed.configureTestingModule({
      imports: [Login, ReactiveFormsModule],
      providers: [
        provideAnimations(),
        provideRouter([]),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: NotificationService, useValue: notificationServiceSpy },
        { provide: LanguageService, useValue: languageServiceMock },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParams } },
        },
      ],
    }).compileComponents();

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router);
    notificationService = TestBed.inject(
      NotificationService,
    ) as jasmine.SpyObj<NotificationService>;

    spyOn(router, 'navigate');

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should create', async () => {
    await setupTestBed();
    expect(component).toBeTruthy();
  });

  describe('Form Initialization', () => {
    beforeEach(async () => {
      await setupTestBed();
    });

    it('should initialize login form with empty values', () => {
      expect(component.loginForm).toBeDefined();
      expect(component.loginForm.get('email')?.value).toBe('');
      expect(component.loginForm.get('password')?.value).toBe('');
      expect(component.loginForm.get('rememberMe')?.value).toBe(false);
    });

    it('should have email and password as required fields', () => {
      const emailControl = component.loginForm.get('email');
      const passwordControl = component.loginForm.get('password');

      expect(emailControl?.hasError('required')).toBe(true);
      expect(passwordControl?.hasError('required')).toBe(true);
    });

    it('should validate email format', () => {
      const emailControl = component.loginForm.get('email');

      emailControl?.setValue('invalid-email');
      expect(emailControl?.hasError('email')).toBe(true);

      emailControl?.setValue('valid@email.com');
      expect(emailControl?.hasError('email')).toBe(false);
    });
  });

  describe('Login Success', () => {
    beforeEach(async () => {
      await setupTestBed();
    });

    it('should login successfully and redirect to home', (done) => {
      const mockResponse = {
        succeeded: true,
        accessToken: 'token',
        refreshToken: 'refresh',
        requires2FA: false,
      };

      authService.login.and.returnValue(of(mockResponse));

      component.loginForm.patchValue({
        email: 'test@test.com',
        password: 'password123',
      });

      component.onSubmit();

      setTimeout(() => {
        expect(authService.login).toHaveBeenCalledWith({
          email: 'test@test.com',
          password: 'password123',
        });
        expect(router.navigate).toHaveBeenCalledWith(['/']);
        expect(component.isLoading).toBe(false);
        done();
      }, 100);
    });

    it('should redirect to 2FA page when 2FA is required', (done) => {
      const mockResponse = {
        succeeded: true,
        requires2FA: true,
        userId: 'user-123',
      };

      authService.login.and.returnValue(of(mockResponse));

      component.loginForm.patchValue({
        email: 'test@test.com',
        password: 'password123',
      });

      component.onSubmit();

      setTimeout(() => {
        expect(router.navigate).toHaveBeenCalledWith(['/auth/2fa'], {
          state: { userId: 'user-123' },
        });
        done();
      }, 100);
    });
  });

  describe('Login Error', () => {
    beforeEach(async () => {
      await setupTestBed();
    });

    it('should show error message on login failure', (done) => {
      authService.login.and.returnValue(
        throwError(() => ({ status: 401, error: { message: 'Invalid credentials' } })),
      );

      component.loginForm.patchValue({
        email: 'test@test.com',
        password: 'wrongpassword',
      });

      component.onSubmit();

      setTimeout(() => {
        expect(component.isLoading).toBe(false);
        done();
      }, 100);
    });

    it('should not submit if form is invalid', () => {
      component.loginForm.patchValue({
        email: '',
        password: '',
      });

      component.onSubmit();

      expect(authService.login).not.toHaveBeenCalled();
      expect(component.loginForm.invalid).toBe(true);
    });

    it('should show error notification when login fails with message', (done) => {
      const mockResponse = {
        succeeded: false,
        message: 'Account locked',
      };

      authService.login.and.returnValue(of(mockResponse));

      component.loginForm.patchValue({
        email: 'test@test.com',
        password: 'password123',
      });

      component.onSubmit();

      setTimeout(() => {
        expect(notificationService.showError).toHaveBeenCalledWith('Account locked');
        expect(component.isLoading).toBe(false);
        done();
      }, 100);
    });
  });

  describe('Password Visibility', () => {
    beforeEach(async () => {
      await setupTestBed();
    });

    it('should toggle password visibility', () => {
      expect(component.hidePassword).toBe(true);

      component.togglePasswordVisibility();
      expect(component.hidePassword).toBe(false);

      component.togglePasswordVisibility();
      expect(component.hidePassword).toBe(true);
    });
  });

  describe('Loading State', () => {
    beforeEach(async () => {
      await setupTestBed();
    });

    it('should set loading to true during login', () => {
      // Use a Subject to control when the observable emits
      const loginSubject = new Subject<any>();
      authService.login.and.returnValue(loginSubject.asObservable());

      component.loginForm.patchValue({
        email: 'test@test.com',
        password: 'password123',
      });

      expect(component.isLoading).toBe(false);

      component.onSubmit();

      // isLoading should be true while waiting for response
      expect(component.isLoading).toBe(true);

      // Now emit the response
      loginSubject.next({
        succeeded: true,
        accessToken: 'token',
        refreshToken: 'refresh',
        requires2FA: false,
      });
      loginSubject.complete();
    });
  });

  describe('Query Parameters', () => {
    afterEach(() => {
      TestBed.resetTestingModule();
    });

    it('should show password changed message when query param is set', async () => {
      await setupTestBed({ passwordChanged: 'true' });
      expect(component.showPasswordChangedMessage).toBe(true);
    });

    it('should show password reset message when query param is set', async () => {
      await setupTestBed({ passwordReset: 'true' });
      expect(component.showPasswordResetMessage).toBe(true);
    });

    it('should set returnUrl from query params', async () => {
      await setupTestBed({ returnUrl: '/profile' });
      expect(component.returnUrl).toBe('/profile');
    });

    it('should sanitize returnUrl that starts with /auth', async () => {
      await setupTestBed({ returnUrl: '/auth/login' });
      expect(component.returnUrl).toBe('/');
    });
  });
});
