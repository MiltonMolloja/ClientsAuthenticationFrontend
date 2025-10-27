import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';
import { LoginRequest } from '@core/models/auth.model';
import { AuthLayoutComponent } from '@shared/components/auth-layout/auth-layout';

@Component({
  selector: 'app-login',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    AuthLayoutComponent
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements OnInit {
  loginForm!: FormGroup;
  hidePassword = true;
  isLoading = false;
  returnUrl = '/';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      rememberMe: [false]
    });

    // Get return URL from route parameters or default to '/'
    const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';

    // Sanitize returnUrl: only accept relative paths (security measure)
    this.returnUrl = this.sanitizeReturnUrl(returnUrl);
  }

  private sanitizeReturnUrl(url: string): string {
    // If URL is absolute (external redirect from ECommerce app)
    // We need to allow it for cross-app authentication
    if (url.includes('://')) {
      // Validate it's from allowed origins (security check)
      const allowedOrigins = ['http://localhost:4200', 'http://localhost:4400'];
      try {
        const urlObj = new URL(url);
        const origin = `${urlObj.protocol}//${urlObj.host}`;
        if (allowedOrigins.includes(origin)) {
          return url; // Allow external redirect
        }
      } catch (e) {
        console.error('Invalid URL:', url);
      }
      return '/'; // Invalid or not allowed
    }

    // If URL starts with /auth, redirect to home instead
    if (url.startsWith('/auth')) {
      return '/';
    }

    // Return sanitized relative URL
    return url.startsWith('/') ? url : '/' + url;
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      const request: LoginRequest = {
        email: this.loginForm.value.email,
        password: this.loginForm.value.password
      };

      this.authService.login(request).subscribe({
        next: (response) => {
          if (response.requires2FA) {
            // Redirect to 2FA page with userId
            this.router.navigate(['/auth/2fa'], {
              state: { userId: response.userId }
            });
          } else if (response.succeeded) {
            this.notificationService.showSuccess('Login successful!');

            // Check if returnUrl is external (cross-app redirect)
            if (this.isExternalUrl(this.returnUrl)) {
              // Redirect to external app with tokens as query params
              let expiresAtStr: string | undefined;
              if (response.expiresAt) {
                // Check if it's already a string or needs conversion
                expiresAtStr = typeof response.expiresAt === 'string'
                  ? response.expiresAt
                  : response.expiresAt.toISOString();
              }
              // Note: isLoading remains true because we're redirecting away from this page
              this.redirectToExternalApp(response.accessToken!, response.refreshToken!, expiresAtStr);
            } else {
              // Normal internal navigation
              this.isLoading = false;
              this.router.navigate([this.returnUrl]);
            }
          } else {
            this.notificationService.showError(response.message || 'Login failed');
            this.isLoading = false;
          }
        },
        error: (error) => {
          this.isLoading = false;
          // Error handling is done by interceptor
        }
      });
    }
  }

  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }

  private isExternalUrl(url: string): boolean {
    return url.includes('://');
  }

  private redirectToExternalApp(accessToken: string, refreshToken: string, expiresAt?: string): void {
    // Parse the return URL to add tokens as query params
    console.log('Redirecting to external app. ReturnUrl:', this.returnUrl);

    const urlObj = new URL(this.returnUrl);

    // Add tokens as query parameters
    urlObj.searchParams.set('accessToken', accessToken);
    urlObj.searchParams.set('refreshToken', refreshToken);
    if (expiresAt) {
      urlObj.searchParams.set('expiresAt', expiresAt);
    }

    const finalUrl = urlObj.toString();
    console.log('Final redirect URL:', finalUrl);

    // Redirect to external app
    window.location.href = finalUrl;
  }
}
