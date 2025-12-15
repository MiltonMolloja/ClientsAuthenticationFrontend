import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { noAuthGuard } from './no-auth.guard';
import { TokenService } from '@core/services/token.service';

describe('noAuthGuard', () => {
  let tokenService: jasmine.SpyObj<TokenService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const tokenServiceSpy = jasmine.createSpyObj('TokenService', [
      'getAccessToken',
      'isTokenExpired',
    ]);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: TokenService, useValue: tokenServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });

    tokenService = TestBed.inject(TokenService) as jasmine.SpyObj<TokenService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should allow access when no token exists', () => {
    tokenService.getAccessToken.and.returnValue(null);

    const route: any = {};
    const state: any = { url: '/auth/login' };

    const result = TestBed.runInInjectionContext(() => noAuthGuard(route, state));

    expect(result).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should allow access when token is expired', () => {
    tokenService.getAccessToken.and.returnValue('expired-token');
    tokenService.isTokenExpired.and.returnValue(true);

    const route: any = {};
    const state: any = { url: '/auth/login' };

    const result = TestBed.runInInjectionContext(() => noAuthGuard(route, state));

    expect(result).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should deny access and redirect to home when valid token exists', () => {
    tokenService.getAccessToken.and.returnValue('valid-token');
    tokenService.isTokenExpired.and.returnValue(false);

    const route: any = {};
    const state: any = { url: '/auth/login' };

    const result = TestBed.runInInjectionContext(() => noAuthGuard(route, state));

    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });
});
