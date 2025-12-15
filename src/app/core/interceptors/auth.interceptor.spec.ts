import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  HttpInterceptorFn,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { authInterceptor } from './auth.interceptor';
import { TokenService } from '@core/services/token.service';

describe('authInterceptor', () => {
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
  let tokenService: jasmine.SpyObj<TokenService>;

  beforeEach(() => {
    const tokenServiceSpy = jasmine.createSpyObj('TokenService', [
      'getAccessToken',
      'getRefreshToken',
    ]);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: TokenService, useValue: tokenServiceSpy },
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
    tokenService = TestBed.inject(TokenService) as jasmine.SpyObj<TokenService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should add Authorization header when token exists', () => {
    tokenService.getAccessToken.and.returnValue('mock-access-token');
    tokenService.getRefreshToken.and.returnValue('mock-refresh-token');

    httpClient.get('/api/test').subscribe();

    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.has('Authorization')).toBe(true);
    expect(req.request.headers.get('Authorization')).toBe('Bearer mock-access-token');
    req.flush({});
  });

  it('should not add Authorization header when no token', () => {
    tokenService.getAccessToken.and.returnValue(null);

    httpClient.get('/api/test').subscribe();

    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('should not add Authorization header for authentication endpoint', () => {
    tokenService.getAccessToken.and.returnValue('mock-access-token');

    httpClient.post('/v1/identity/authentication', {}).subscribe();

    const req = httpMock.expectOne('/v1/identity/authentication');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('should add Refresh-Token header for sessions endpoint', () => {
    tokenService.getAccessToken.and.returnValue('mock-access-token');
    tokenService.getRefreshToken.and.returnValue('mock-refresh-token');

    httpClient.get('/v1/identity/sessions').subscribe();

    const req = httpMock.expectOne('/v1/identity/sessions');
    expect(req.request.headers.has('Authorization')).toBe(true);
    expect(req.request.headers.has('Refresh-Token')).toBe(true);
    expect(req.request.headers.get('Refresh-Token')).toBe('mock-refresh-token');
    req.flush({});
  });

  it('should not add Refresh-Token header for non-sessions endpoints', () => {
    tokenService.getAccessToken.and.returnValue('mock-access-token');
    tokenService.getRefreshToken.and.returnValue('mock-refresh-token');

    httpClient.get('/api/profile').subscribe();

    const req = httpMock.expectOne('/api/profile');
    expect(req.request.headers.has('Authorization')).toBe(true);
    expect(req.request.headers.has('Refresh-Token')).toBe(false);
    req.flush({});
  });
});
