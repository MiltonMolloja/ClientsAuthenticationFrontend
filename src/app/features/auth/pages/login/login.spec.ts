import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { Login } from './login';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';
import { LanguageService } from '@core/services/language.service';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let notificationService: jasmine.SpyObj<NotificationService>;
  let languageService: jasmine.SpyObj<LanguageService>;
  let activatedRoute: { snapshot: { queryParams: Record<string, string> } };

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['login']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const notificationServiceSpy = jasmine.createSpyObj('NotificationService', [
      'showSuccess',
      'showError',
    ]);
    const languageServiceSpy = jasmine.createSpyObj('LanguageService', ['t']);

    activatedRoute = {
      snapshot: {
        queryParams: {},
      },
    };

    await TestBed.configureTestingModule({
      imports: [Login, ReactiveFormsModule],
      providers: [
        provideAnimations(),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: NotificationService, useValue: notificationServiceSpy },
        { provide: LanguageService, useValue: languageServiceSpy },
        { provide: ActivatedRoute, useValue: activatedRoute },
      ],
    }).compileComponents();

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    notificationService = TestBed.inject(
      NotificationService,
    ) as jasmine.SpyObj<NotificationService>;
    languageService = TestBed.inject(LanguageService) as jasmine.SpyObj<LanguageService>;

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Initialization', () => {
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
    it('should toggle password visibility', () => {
      expect(component.hidePassword).toBe(true);

      component.togglePasswordVisibility();
      expect(component.hidePassword).toBe(false);

      component.togglePasswordVisibility();
      expect(component.hidePassword).toBe(true);
    });
  });

  describe('Loading State', () => {
    it('should set loading to true during login', () => {
      authService.login.and.returnValue(
        of({
          succeeded: true,
          accessToken: 'token',
          refreshToken: 'refresh',
          requires2FA: false,
        }),
      );

      component.loginForm.patchValue({
        email: 'test@test.com',
        password: 'password123',
      });

      expect(component.isLoading).toBe(false);

      component.onSubmit();

      expect(component.isLoading).toBe(true);
    });
  });

  describe('Query Parameters', () => {
    it('should show password changed message when query param is set', () => {
      activatedRoute.snapshot.queryParams = { passwordChanged: 'true' };

      component.ngOnInit();

      expect(component.showPasswordChangedMessage).toBe(true);
    });

    it('should show password reset message when query param is set', () => {
      activatedRoute.snapshot.queryParams = { passwordReset: 'true' };

      component.ngOnInit();

      expect(component.showPasswordResetMessage).toBe(true);
    });

    it('should set returnUrl from query params', () => {
      activatedRoute.snapshot.queryParams = { returnUrl: '/profile' };

      component.ngOnInit();

      expect(component.returnUrl).toBe('/profile');
    });

    it('should sanitize returnUrl that starts with /auth', () => {
      activatedRoute.snapshot.queryParams = { returnUrl: '/auth/login' };

      component.ngOnInit();

      expect(component.returnUrl).toBe('/');
    });
  });
});
