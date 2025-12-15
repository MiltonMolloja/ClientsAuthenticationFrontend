import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { noAuthGuard } from './no-auth.guard';
import { AuthService } from '@core/services/auth.service';

describe('noAuthGuard', () => {
  let authService: { isAuthenticated: boolean };
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    // Create a simple mock object with isAuthenticated property
    authService = { isAuthenticated: false };
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: routerSpy },
      ],
    });

    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should allow access when user is not authenticated', () => {
    authService.isAuthenticated = false;

    const route: any = {};
    const state: any = { url: '/auth/login' };

    const result = TestBed.runInInjectionContext(() => noAuthGuard(route, state));

    expect(result).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should deny access and redirect to profile when user is authenticated', () => {
    authService.isAuthenticated = true;

    const route: any = {};
    const state: any = { url: '/auth/login' };

    const result = TestBed.runInInjectionContext(() => noAuthGuard(route, state));

    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/profile']);
  });
});
