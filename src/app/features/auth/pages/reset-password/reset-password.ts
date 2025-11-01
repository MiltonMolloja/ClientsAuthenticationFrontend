import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';
import { LanguageService } from '@core/services/language.service';
import { AuthLayoutComponent } from '@shared/components/auth-layout/auth-layout';

@Component({
  selector: 'app-reset-password',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    AuthLayoutComponent
  ],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.scss',
})
export class ResetPassword implements OnInit {
  resetPasswordForm!: FormGroup;
  showNewPassword = false;
  showConfirmPassword = false;
  isLoading = false;
  error = '';
  token = '';  // Token stored in memory, NOT in localStorage
  email = '';  // Email stored in memory, NOT in localStorage

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private notificationService: NotificationService,
    public languageService: LanguageService
  ) {}

  ngOnInit(): void {
    // Initialize the form with password matching validation
    this.resetPasswordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });

    // Extract token and email from URL query parameters
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || '';
      this.email = params['email'] || '';

      console.log('🔑 Token from URL:', this.token);
      console.log('📧 Email from URL:', this.email);
      console.log('📦 All query params:', params);

      // Validate token and email exist
      if (!this.token) {
        this.error = this.languageService.t('resetPassword.invalidToken');
        this.resetPasswordForm.disable();
      }
      if (!this.email) {
        this.error = 'Email is required';
        this.resetPasswordForm.disable();
      }
    });
  }

  // Custom validator to check if passwords match
  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const newPassword = control.get('newPassword');
    const confirmPassword = control.get('confirmPassword');

    if (!newPassword || !confirmPassword) {
      return null;
    }

    if (newPassword.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }

    return null;
  }

  onSubmit(): void {
    if (this.resetPasswordForm.valid && this.token && this.email) {
      this.isLoading = true;
      this.error = '';

      const request = {
        email: this.email,
        token: this.token,
        newPassword: this.resetPasswordForm.value.newPassword,
        confirmPassword: this.resetPasswordForm.value.confirmPassword
      };

      console.log('🚀 Sending reset password request:', {
        email: this.email,
        tokenLength: this.token.length,
        hasNewPassword: !!this.resetPasswordForm.value.newPassword,
        request: request
      });

      this.authService.resetPassword(request).subscribe({
        next: (response) => {
          console.log('✅ Reset password response:', response);
          this.isLoading = false;

          // Check if response is successful (200 status = success)
          // Backend might return empty response or different structure
          if (response === null || response === undefined || response.succeeded === true || response.succeeded === undefined) {
            console.log('🎉 Password reset successful, redirecting to login...');
            // Redirect immediately to login with passwordReset flag
            this.router.navigate(['/auth/login'], {
              queryParams: { passwordReset: 'true' }
            });
          } else {
            console.error('❌ Reset password failed:', response);
            this.error = response.message || this.languageService.t('common.error');
          }
        },
        error: (error) => {
          console.error('❌ Reset password error:', error);
          this.isLoading = false;
          this.error = error.error?.message || this.languageService.t('common.error');
        }
      });
    }
  }

  onCancel(): void {
    // Redirect to home page (ECommerce app)
    window.location.href = 'http://localhost:4200/';
  }

  toggleNewPasswordVisibility(): void {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }
}
