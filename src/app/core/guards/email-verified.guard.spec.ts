import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { emailVerifiedGuard } from './email-verified.guard';
import { AuthService } from '@core/services/auth.service';

describe('emailVerifiedGuard', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', [], {
      currentUser: null,
    });
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should allow access when email is verified', () => {
    Object.defineProperty(authService, 'currentUser', {
      get: () => ({ emailConfirmed: true }),
      configurable: true,
    });

    const route: any = {};
    const state: any = { url: '/profile' };

    const result = TestBed.runInInjectionContext(() => emailVerifiedGuard(route, state));

    expect(result).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should deny access and redirect when email is not verified', () => {
    Object.defineProperty(authService, 'currentUser', {
      get: () => ({ emailConfirmed: false }),
      configurable: true,
    });

    const route: any = {};
    const state: any = { url: '/profile' };

    const result = TestBed.runInInjectionContext(() => emailVerifiedGuard(route, state));

    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/auth/confirm-email']);
  });

  it('should deny access when no user is logged in', () => {
    Object.defineProperty(authService, 'currentUser', {
      get: () => null,
      configurable: true,
    });

    const route: any = {};
    const state: any = { url: '/profile' };

    const result = TestBed.runInInjectionContext(() => emailVerifiedGuard(route, state));

    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/auth/confirm-email']);
  });
});
