import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';

import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';
import { TwoFactorAuthRequest } from '@core/models/auth.model';
import { CodeInput } from '@shared/components/code-input/code-input';

@Component({
  selector: 'app-two-factor-auth',
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    CodeInput
  ],
  templateUrl: './two-factor-auth.html',
  styleUrl: './two-factor-auth.scss',
})
export class TwoFactorAuth implements OnInit {
  userId: string = '';
  rememberDevice = false;
  isLoading = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) {
    // Get userId from navigation state
    const navigation = this.router.getCurrentNavigation();
    this.userId = navigation?.extras?.state?.['userId'] || '';
  }

  ngOnInit(): void {
    // If no userId, redirect back to login
    if (!this.userId) {
      this.notificationService.showError('Invalid session. Please login again.');
      this.router.navigate(['/auth/login']);
    }
  }

  onCodeComplete(code: string): void {
    this.verify2FA(code);
  }

  verify2FA(code: string): void {
    if (this.isLoading) return;

    this.isLoading = true;
    const request: TwoFactorAuthRequest = {
      userId: this.userId,
      code: code,
      rememberDevice: this.rememberDevice
    };

    this.authService.authenticate2FA(request).subscribe({
      next: (response) => {
        if (response.succeeded) {
          this.notificationService.showSuccess('Authentication successful!');
          this.router.navigate(['/profile']);
        } else {
          this.notificationService.showError(response.message || '2FA verification failed');
          this.isLoading = false;
        }
      },
      error: () => {
        this.isLoading = false;
        // Error handling is done by interceptor
      }
    });
  }
}
