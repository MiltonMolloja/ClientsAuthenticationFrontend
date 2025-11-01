import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { tap, catchError, finalize, switchMap } from 'rxjs/operators';

import { environment } from '@environments/environment';
import { TokenService } from './token.service';
import { User } from '@core/models/user.model';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  TwoFactorAuthRequest,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ConfirmEmailRequest,
  Enable2FAResponse,
  Disable2FARequest,
  RegenerateBackupCodesRequest,
  RegenerateBackupCodesResponse
} from '@core/models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = environment.apiUrl;
  private currentUserSignal = signal<User | null>(null);
  private isAuthenticatedSignal = signal<boolean>(false);

  constructor(
    private http: HttpClient,
    private tokenService: TokenService,
    private router: Router
  ) {
    this.checkAuthStatus();
  }

  // Authentication
  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/v1/identity/authentication`, request)
      .pipe(
        tap(response => {
          if (response.succeeded && !response.requires2FA) {
            this.handleAuthSuccess(response);
          }
        })
      );
  }

  register(request: RegisterRequest): Observable<any> {
    return this.http.post(`${this.API_URL}/v1/identity`, request);
  }

  logout(): Observable<any> {
    const refreshToken = this.tokenService.getRefreshToken();
    return this.http.post(`${this.API_URL}/v1/identity/revoke-token`, { refreshToken })
      .pipe(
        finalize(() => {
          this.clearAuthData();
          this.router.navigate(['/auth/login']);
        })
      );
  }

  refreshToken(): Observable<LoginResponse> {
    const refreshToken = this.tokenService.getRefreshToken();
    return this.http.post<LoginResponse>(`${this.API_URL}/v1/identity/refresh-token`, { refreshToken })
      .pipe(
        tap(response => {
          if (response.succeeded) {
            this.tokenService.setTokens(response.accessToken!, response.refreshToken!);
            // Update currentUserSignal with new JWT data
            this.loadCurrentUser();
          }
        }),
        catchError(err => {
          this.clearAuthData();
          this.router.navigate(['/auth/login']);
          return throwError(() => err);
        })
      );
  }

  // 2FA
  authenticate2FA(request: TwoFactorAuthRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/v1/identity/2fa/authenticate`, request)
      .pipe(
        tap(response => {
          if (response.succeeded) {
            this.handleAuthSuccess(response);
          }
        })
      );
  }

  // Password Management
  changePassword(request: ChangePasswordRequest): Observable<any> {
    return this.http.post(`${this.API_URL}/v1/identity/change-password`, request);
  }

  forgotPassword(request: ForgotPasswordRequest): Observable<any> {
    return this.http.post(`${this.API_URL}/v1/identity/forgot-password`, request);
  }

  resetPassword(request: ResetPasswordRequest): Observable<any> {
    console.log('📨 AuthService.resetPassword called with:', {
      url: `${this.API_URL}/v1/identity/reset-password`,
      request: request,
      email: request.email,
      tokenLength: request.token.length
    });

    // Send email and token in the body (not in Authorization header)
    return this.http.post(`${this.API_URL}/v1/identity/reset-password`, request);
  }

  // Email Confirmation
  confirmEmail(request: ConfirmEmailRequest): Observable<any> {
    return this.http.post(`${this.API_URL}/v1/identity/confirm-email`, request)
      .pipe(
        switchMap(response => {
          // After successful email confirmation, refresh the token to get updated JWT
          return this.refreshToken().pipe(
            catchError(refreshError => {
              // Return the original confirmation response even if refresh fails
              return throwError(() => refreshError);
            })
          );
        })
      );
  }

  resendEmailConfirmation(email: string): Observable<any> {
    return this.http.post(`${this.API_URL}/v1/identity/resend-email-confirmation`, { email });
  }

  // Two-Factor Authentication
  enable2FA(): Observable<Enable2FAResponse> {
    return this.http.post<Enable2FAResponse>(`${this.API_URL}/v1/identity/2fa/enable`, {});
  }

  verify2FA(code: string): Observable<any> {
    return this.http.post(`${this.API_URL}/v1/identity/2fa/verify`, { code });
  }

  disable2FA(request: Disable2FARequest): Observable<any> {
    return this.http.post(`${this.API_URL}/v1/identity/2fa/disable`, request);
  }

  regenerateBackupCodes(request: RegenerateBackupCodesRequest): Observable<RegenerateBackupCodesResponse> {
    return this.http.post<RegenerateBackupCodesResponse>(
      `${this.API_URL}/v1/identity/2fa/backup-codes/regenerate`,
      request
    );
  }

  // Helper methods
  private handleAuthSuccess(response: LoginResponse): void {
    this.tokenService.setTokens(response.accessToken!, response.refreshToken!);
    this.loadCurrentUser();
    this.isAuthenticatedSignal.set(true);
  }

  private clearAuthData(): void {
    this.tokenService.clearTokens();
    this.currentUserSignal.set(null);
    this.isAuthenticatedSignal.set(false);
  }

  // Public method to clear auth data without navigation (for password change flow)
  public clearAuthDataOnly(): void {
    this.clearAuthData();
  }

  private checkAuthStatus(): void {
    const token = this.tokenService.getAccessToken();
    if (token && !this.tokenService.isTokenExpired(token)) {
      this.loadCurrentUser();
      this.isAuthenticatedSignal.set(true);
    }
  }

  private loadCurrentUser(): void {
    const token = this.tokenService.getAccessToken();
    if (token) {
      const decoded = this.tokenService.decodeToken(token);

      const user: User = {
        id: decoded.nameid || decoded.sub,
        firstName: decoded.unique_name || decoded.name || decoded.given_name || '',
        lastName: decoded.family_name || decoded.surname || '',
        email: decoded.email,
        emailConfirmed: decoded.EmailConfirmed === 'true' || decoded.emailConfirmed === 'true' || decoded.email_verified === true,
        phoneNumber: decoded.phoneNumber || decoded.phone_number,
        phoneNumberConfirmed: decoded.PhoneNumberConfirmed === 'true' || decoded.phoneNumberConfirmed === 'true',
        twoFactorEnabled: decoded.TwoFactorEnabled === 'true' || decoded.twoFactorEnabled === 'true',
        lockoutEnabled: false,
        accessFailedCount: 0,
        passwordChangedAt: decoded.PasswordChangedAt || decoded.passwordChangedAt ? new Date(decoded.PasswordChangedAt || decoded.passwordChangedAt) : undefined
      };
      this.currentUserSignal.set(user);
    }
  }

  // Public method to set authenticated user (used by callback)
  setAuthenticatedUser(decoded: any): void {
    const user: User = {
      id: decoded.nameid || decoded.sub,
      firstName: decoded.unique_name || decoded.name || decoded.given_name || '',
      lastName: decoded.family_name || decoded.surname || '',
      email: decoded.email,
      emailConfirmed: decoded.EmailConfirmed === 'true' || decoded.emailConfirmed === 'true' || decoded.email_verified === true,
      phoneNumber: decoded.phoneNumber || decoded.phone_number,
      phoneNumberConfirmed: decoded.PhoneNumberConfirmed === 'true' || decoded.phoneNumberConfirmed === 'true',
      twoFactorEnabled: decoded.TwoFactorEnabled === 'true' || decoded.twoFactorEnabled === 'true',
      lockoutEnabled: false,
      accessFailedCount: 0,
      passwordChangedAt: decoded.PasswordChangedAt || decoded.passwordChangedAt ? new Date(decoded.PasswordChangedAt || decoded.passwordChangedAt) : undefined
    };
    this.currentUserSignal.set(user);
    this.isAuthenticatedSignal.set(true);
  }

  // Getters
  get currentUser(): User | null {
    return this.currentUserSignal();
  }

  get isAuthenticated(): boolean {
    return this.isAuthenticatedSignal();

  }
  // Get current user from API
  getCurrentUserFromApi(): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/v1/identity/me`)
      .pipe(
        tap(user => {
          this.currentUserSignal.set(user);
        })
      );
  }

  // Update user profile
  updateUserProfile(firstName: string, lastName: string): Observable<any> {
    return this.http.put(`${this.API_URL}/v1/identity/profile`, { firstName, lastName })
      .pipe(
        tap(() => {
          // Update local user data immediately for instant UI update
          const currentUser = this.currentUserSignal();
          if (currentUser) {
            this.currentUserSignal.set({
              ...currentUser,
              firstName,
              lastName
            });
          }

          // Note: The JWT token still contains old firstName/lastName
          // The token will be updated on next login or manual refresh
          // For now, local state update is sufficient for UI consistency
        })
      );
  }

  /**
   * Get all active sessions for the current user
   */
  getSessions(): Observable<any> {
    return this.http.get(`${this.API_URL}/v1/identity/sessions`);
  }

  /**
   * Revoke a specific session by session ID
   */
  revokeSession(sessionId: number): Observable<any> {
    return this.http.delete(`${this.API_URL}/v1/identity/sessions/${sessionId}`);
  }

  /**
   * Revoke all sessions except the current one
   */
  revokeAllSessions(): Observable<any> {
    return this.http.delete(`${this.API_URL}/v1/identity/sessions/all`);
  }

  /**
   * Get user activity log
   */
  getActivity(limit: number = 20): Observable<any> {
    return this.http.get(`${this.API_URL}/v1/identity/activity?limit=${limit}`);
  }
}
