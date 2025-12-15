import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { authGuard } from './auth.guard';
import { TokenService } from '@core/services/token.service';
import { AuthService } from '@core/services/auth.service';

describe('authGuard', () => {
  let tokenService: jasmine.SpyObj<TokenService>;
  let router: jasmine.SpyObj<Router>;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    const tokenServiceSpy = jasmine.createSpyObj('TokenService', [
      'getAccessToken',
      'isTokenExpired',
    ]);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['logout']);

    TestBed.configureTestingModule({
      providers: [
        { provide: TokenService, useValue: tokenServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: AuthService, useValue: authServiceSpy },
      ],
    });

    tokenService = TestBed.inject(TokenService) as jasmine.SpyObj<TokenService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
  });

  it('should allow access when token is valid', () => {
    tokenService.getAccessToken.and.returnValue('valid-token');
    tokenService.isTokenExpired.and.returnValue(false);

    const route: any = {};
    const state: any = { url: '/profile' };

    const result = TestBed.runInInjectionContext(() => authGuard(route, state));

    expect(result).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should deny access and redirect to login when no token', () => {
    tokenService.getAccessToken.and.returnValue(null);

    const route: any = {};
    const state: any = { url: '/profile' };

    const result = TestBed.runInInjectionContext(() => authGuard(route, state));

    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/auth/login'], {
      queryParams: { returnUrl: '/profile' },
    });
  });

  it('should deny access and redirect to login when token is expired', () => {
    tokenService.getAccessToken.and.returnValue('expired-token');
    tokenService.isTokenExpired.and.returnValue(true);

    const route: any = {};
    const state: any = { url: '/settings' };

    const result = TestBed.runInInjectionContext(() => authGuard(route, state));

    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/auth/login'], {
      queryParams: { returnUrl: '/settings' },
    });
  });

  it('should include returnUrl in query params', () => {
    tokenService.getAccessToken.and.returnValue(null);

    const route: any = {};
    const state: any = { url: '/admin/users' };

    TestBed.runInInjectionContext(() => authGuard(route, state));

    expect(router.navigate).toHaveBeenCalledWith(['/auth/login'], {
      queryParams: { returnUrl: '/admin/users' },
    });
  });
});
