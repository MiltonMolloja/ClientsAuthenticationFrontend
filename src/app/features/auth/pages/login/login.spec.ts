import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login';
import { AuthService } from '@core/services/auth.service';
import { LanguageService } from '@core/services/language.service';
import { MatSnackBar } from '@angular/material/snack-bar';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let languageService: jasmine.SpyObj<LanguageService>;
  let activatedRoute: any;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['login']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    const languageServiceSpy = jasmine.createSpyObj('LanguageService', ['t']);

    activatedRoute = {
      queryParams: of({ returnUrl: null }),
    };

    await TestBed.configureTestingModule({
      imports: [LoginComponent, ReactiveFormsModule],
      providers: [
        provideAnimations(),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: LanguageService, useValue: languageServiceSpy },
        { provide: ActivatedRoute, useValue: activatedRoute },
      ],
    }).compileComponents();

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    languageService = TestBed.inject(LanguageService) as jasmine.SpyObj<LanguageService>;

    fixture = TestBed.createComponent(LoginComponent);
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
        expect(component.isLoading()).toBe(false);
        done();
      }, 100);
    });

    it('should redirect to returnUrl after successful login', (done) => {
      activatedRoute.queryParams = of({ returnUrl: '/profile' });

      const mockResponse = {
        succeeded: true,
        accessToken: 'token',
        refreshToken: 'refresh',
        requires2FA: false,
      };

      authService.login.and.returnValue(of(mockResponse));

      component.ngOnInit();
      component.loginForm.patchValue({
        email: 'test@test.com',
        password: 'password123',
      });

      component.onSubmit();

      setTimeout(() => {
        expect(router.navigate).toHaveBeenCalledWith(['/profile']);
        done();
      }, 100);
    });

    it('should redirect to 2FA page when 2FA is required', (done) => {
      const mockResponse = {
        succeeded: true,
        requires2FA: true,
      };

      authService.login.and.returnValue(of(mockResponse));

      component.loginForm.patchValue({
        email: 'test@test.com',
        password: 'password123',
      });

      component.onSubmit();

      setTimeout(() => {
        expect(router.navigate).toHaveBeenCalledWith(['/auth/2fa'], {
          queryParams: { email: 'test@test.com' },
        });
        done();
      }, 100);
    });
  });

  describe('Login Error', () => {
    it('should show error message on login failure', (done) => {
      languageService.t.and.returnValue('Invalid credentials');
      authService.login.and.returnValue(
        throwError(() => ({ status: 401, error: { message: 'Invalid credentials' } })),
      );

      component.loginForm.patchValue({
        email: 'test@test.com',
        password: 'wrongpassword',
      });

      component.onSubmit();

      setTimeout(() => {
        expect(snackBar.open).toHaveBeenCalled();
        expect(component.isLoading()).toBe(false);
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
  });

  describe('Remember Me', () => {
    it('should include rememberMe in login request', (done) => {
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
        rememberMe: true,
      });

      component.onSubmit();

      setTimeout(() => {
        expect(authService.login).toHaveBeenCalledWith({
          email: 'test@test.com',
          password: 'password123',
        });
        done();
      }, 100);
    });
  });

  describe('Navigation', () => {
    it('should navigate to register page', () => {
      component.goToRegister();

      expect(router.navigate).toHaveBeenCalledWith(['/auth/register']);
    });

    it('should navigate to forgot password page', () => {
      component.goToForgotPassword();

      expect(router.navigate).toHaveBeenCalledWith(['/auth/forgot-password']);
    });
  });

  describe('External Login', () => {
    it('should have Google login button', () => {
      const compiled = fixture.nativeElement;
      const googleButton = compiled.querySelector('[data-provider="google"]');

      expect(googleButton).toBeTruthy();
    });

    it('should have Microsoft login button', () => {
      const compiled = fixture.nativeElement;
      const microsoftButton = compiled.querySelector('[data-provider="microsoft"]');

      expect(microsoftButton).toBeTruthy();
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

      expect(component.isLoading()).toBe(false);

      component.onSubmit();

      expect(component.isLoading()).toBe(true);
    });

    it('should disable form during loading', () => {
      component.isLoading.set(true);
      fixture.detectChanges();

      expect(component.loginForm.disabled).toBe(true);
    });
  });
});
