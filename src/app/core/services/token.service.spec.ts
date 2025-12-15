import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { TokenService } from './token.service';

describe('TokenService', () => {
  let service: TokenService;
  let localStorageSpy: jasmine.SpyObj<Storage>;

  beforeEach(() => {
    // Mock localStorage
    localStorageSpy = jasmine.createSpyObj('localStorage', ['getItem', 'setItem', 'removeItem']);

    TestBed.configureTestingModule({
      providers: [TokenService, { provide: PLATFORM_ID, useValue: 'browser' }],
    });

    service = TestBed.inject(TokenService);

    // Replace localStorage with spy
    spyOn(localStorage, 'getItem').and.callFake(localStorageSpy.getItem);
    spyOn(localStorage, 'setItem').and.callFake(localStorageSpy.setItem);
    spyOn(localStorage, 'removeItem').and.callFake(localStorageSpy.removeItem);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('setTokens', () => {
    it('should set access and refresh tokens in localStorage', () => {
      service.setTokens('access-token', 'refresh-token');

      expect(localStorage.setItem).toHaveBeenCalledWith('access_token', 'access-token');
      expect(localStorage.setItem).toHaveBeenCalledWith('refresh_token', 'refresh-token');
    });

    it('should handle localStorage errors gracefully', () => {
      localStorageSpy.setItem.and.throwError('QuotaExceededError');
      spyOn(console, 'error');

      expect(() => service.setTokens('token1', 'token2')).not.toThrow();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('getAccessToken', () => {
    it('should get access token from localStorage', () => {
      localStorageSpy.getItem.and.returnValue('mock-access-token');

      const token = service.getAccessToken();

      expect(localStorage.getItem).toHaveBeenCalledWith('access_token');
      expect(token).toBe('mock-access-token');
    });

    it('should return null if no token exists', () => {
      localStorageSpy.getItem.and.returnValue(null);

      const token = service.getAccessToken();

      expect(token).toBeNull();
    });

    it('should handle localStorage errors and return null', () => {
      localStorageSpy.getItem.and.throwError('SecurityError');
      spyOn(console, 'error');

      const token = service.getAccessToken();

      expect(token).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('getRefreshToken', () => {
    it('should get refresh token from localStorage', () => {
      localStorageSpy.getItem.and.returnValue('mock-refresh-token');

      const token = service.getRefreshToken();

      expect(localStorage.getItem).toHaveBeenCalledWith('refresh_token');
      expect(token).toBe('mock-refresh-token');
    });

    it('should return null if no token exists', () => {
      localStorageSpy.getItem.and.returnValue(null);

      const token = service.getRefreshToken();

      expect(token).toBeNull();
    });
  });

  describe('clearTokens', () => {
    it('should remove both tokens from localStorage', () => {
      service.clearTokens();

      expect(localStorage.removeItem).toHaveBeenCalledWith('access_token');
      expect(localStorage.removeItem).toHaveBeenCalledWith('refresh_token');
    });

    it('should handle localStorage errors gracefully', () => {
      localStorageSpy.removeItem.and.throwError('SecurityError');
      spyOn(console, 'error');

      expect(() => service.clearTokens()).not.toThrow();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('decodeToken', () => {
    it('should decode a valid JWT token', () => {
      // JWT with payload: { sub: "123", email: "test@test.com", exp: 1234567890 }
      const validToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJlbWFpbCI6InRlc3RAdGVzdC5jb20iLCJleHAiOjEyMzQ1Njc4OTB9.xyz';

      const decoded = service.decodeToken(validToken);

      expect(decoded).toBeTruthy();
      expect(decoded.sub).toBe('123');
      expect(decoded.email).toBe('test@test.com');
    });

    it('should return null for invalid token', () => {
      const invalidToken = 'invalid.token.here';

      const decoded = service.decodeToken(invalidToken);

      expect(decoded).toBeNull();
    });

    it('should return null for malformed token', () => {
      const malformedToken = 'not-a-jwt';

      const decoded = service.decodeToken(malformedToken);

      expect(decoded).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for non-expired token', () => {
      // Token expires in the future (year 2099)
      const futureExp = Math.floor(new Date('2099-01-01').getTime() / 1000);
      const token = `header.${btoa(JSON.stringify({ exp: futureExp }))}.signature`;

      const isExpired = service.isTokenExpired(token);

      expect(isExpired).toBe(false);
    });

    it('should return true for expired token', () => {
      // Token expired in the past (year 2000)
      const pastExp = Math.floor(new Date('2000-01-01').getTime() / 1000);
      const token = `header.${btoa(JSON.stringify({ exp: pastExp }))}.signature`;

      const isExpired = service.isTokenExpired(token);

      expect(isExpired).toBe(true);
    });

    it('should return true for token without exp claim', () => {
      const token = `header.${btoa(JSON.stringify({ sub: '123' }))}.signature`;

      const isExpired = service.isTokenExpired(token);

      expect(isExpired).toBe(true);
    });

    it('should return true for invalid token', () => {
      const invalidToken = 'invalid-token';

      const isExpired = service.isTokenExpired(invalidToken);

      expect(isExpired).toBe(true);
    });
  });

  describe('getTokenExpirationDate', () => {
    it('should return expiration date for valid token', () => {
      // Use a fixed date far in the future
      const futureDate = new Date('2099-06-15T12:00:00Z');
      const expTimestamp = Math.floor(futureDate.getTime() / 1000);
      const token = `header.${btoa(JSON.stringify({ exp: expTimestamp }))}.signature`;

      const expirationDate = service.getTokenExpirationDate(token);

      expect(expirationDate).toBeTruthy();
      // Check that the year is 2099 (accounting for timezone differences)
      expect(expirationDate!.getUTCFullYear()).toBe(2099);
    });

    it('should return null for token without exp claim', () => {
      const token = `header.${btoa(JSON.stringify({ sub: '123' }))}.signature`;

      const expirationDate = service.getTokenExpirationDate(token);

      expect(expirationDate).toBeNull();
    });

    it('should return null for invalid token', () => {
      const invalidToken = 'invalid-token';

      const expirationDate = service.getTokenExpirationDate(invalidToken);

      expect(expirationDate).toBeNull();
    });
  });

  describe('SSR safety', () => {
    it('should not throw errors in SSR environment', () => {
      // Create service with server platform
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [TokenService, { provide: PLATFORM_ID, useValue: 'server' }],
      });

      const serverService = TestBed.inject(TokenService);

      expect(() => serverService.setTokens('token1', 'token2')).not.toThrow();
      expect(() => serverService.getAccessToken()).not.toThrow();
      expect(() => serverService.getRefreshToken()).not.toThrow();
      expect(() => serverService.clearTokens()).not.toThrow();

      expect(serverService.getAccessToken()).toBeNull();
      expect(serverService.getRefreshToken()).toBeNull();
    });
  });
});
