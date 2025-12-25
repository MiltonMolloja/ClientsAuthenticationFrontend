import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { AuthService } from '@core/services/auth.service';
import { TokenService } from '@core/services/token.service';
import { NotificationService } from '@core/services/notification.service';

@Component({
  selector: 'app-callback',
  imports: [CommonModule, MatProgressSpinnerModule, MatCardModule],
  templateUrl: './callback.html',
  styleUrl: './callback.scss',
})
export class Callback implements OnInit {
  isProcessing = true;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private tokenService: TokenService,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    this.handleCallback();
  }

  private handleCallback(): void {
    // Get query parameters
    const params = this.route.snapshot.queryParams;
    const next = params['next'] || '/';
    const token = params['token'];
    // Support both camelCase (accessToken) and snake_case (access_token)
    const accessToken = params['accessToken'] || params['access_token'];
    const refreshToken = params['refreshToken'] || params['refresh_token'];

    // If we have tokens in query params (from Identity Server)
    if (accessToken) {
      // Store tokens
      this.tokenService.setTokens(accessToken, refreshToken || '');

      // Decode token to get user info
      const decoded = this.tokenService.decodeToken(accessToken);
      if (decoded) {
        // Update auth service state
        this.authService.setAuthenticatedUser(decoded);
        this.notificationService.showSuccess('Login successful!');

        // Redirect to ecommerce site with tokens (use /login-callback to avoid Traefik routing to auth)
        const ecommerceUrl = this.getEcommerceUrl();
        const redirectUrl = `${ecommerceUrl}/login-callback?next=${encodeURIComponent(next)}&access_token=${encodeURIComponent(accessToken)}&refresh_token=${encodeURIComponent(refreshToken || '')}`;
        window.location.href = redirectUrl;
      } else {
        this.showError('Invalid token received');
      }
    }
    // If we have a single token parameter
    else if (token) {
      this.tokenService.setTokens(token, '');
      const decoded = this.tokenService.decodeToken(token);
      if (decoded) {
        this.authService.setAuthenticatedUser(decoded);
        this.notificationService.showSuccess('Login successful!');

        // Redirect to ecommerce site (use /login-callback to avoid Traefik routing to auth)
        const ecommerceUrl = this.getEcommerceUrl();
        window.location.href = `${ecommerceUrl}/login-callback?next=${encodeURIComponent(next)}&access_token=${encodeURIComponent(token)}`;
      } else {
        this.showError('Invalid token received');
      }
    }
    // No tokens found
    else {
      this.showError('No authentication token received');
    }
  }

  private getEcommerceUrl(): string {
    // Get from environment or window.__env
    const windowEnv = (window as unknown as { __env?: { ecommerceUrl?: string } }).__env;
    return windowEnv?.ecommerceUrl || 'https://miecommerce.duckdns.org';
  }

  private showError(message: string): void {
    this.isProcessing = false;
    this.errorMessage = message;
    this.notificationService.showError(message);

    // Redirect to login after 3 seconds
    setTimeout(() => {
      this.router.navigate(['/login']);
    }, 3000);
  }
}
