import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';
import { AuthLayoutComponent } from '@shared/components/auth-layout/auth-layout';

@Component({
  selector: 'app-confirm-email',
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    AuthLayoutComponent
  ],
  templateUrl: './confirm-email.html',
  styleUrl: './confirm-email.scss',
})
export class ConfirmEmail implements OnInit {
  email: string = '';
  isResending = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    // Get email from router state (works after navigation)
    const state = history.state;
    if (state && state.email) {
      this.email = state.email;
    }
  }

  resendVerificationEmail(): void {
    if (!this.email) {
      this.notificationService.showError('Email address not found. Please try registering again.');
      return;
    }

    this.isResending = true;
    this.authService.resendEmailConfirmation(this.email).subscribe({
      next: () => {
        this.notificationService.showSuccess('Verification email sent! Please check your inbox.');
        this.isResending = false;
      },
      error: () => {
        this.isResending = false;
        // Error handling is done by interceptor
      }
    });
  }
}
