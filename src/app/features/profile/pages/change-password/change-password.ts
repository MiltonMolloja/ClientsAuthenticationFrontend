import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs/operators';

import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';
import { LanguageService } from '@core/services/language.service';
import { ChangePasswordRequest } from '@core/models/auth.model';
import { DashboardLayoutComponent } from '@shared/components/dashboard-layout/dashboard-layout';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-change-password',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    DashboardLayoutComponent,
  ],
  templateUrl: './change-password.html',
  styleUrl: './change-password.scss',
})
export class ChangePassword implements OnInit {
  changePasswordForm!: FormGroup;
  hideCurrentPassword = true;
  hideNewPassword = true;
  hideConfirmPassword = true;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService,
    private languageService: LanguageService,
  ) {}

  ngOnInit(): void {
    this.changePasswordForm = this.fb.group(
      {
        currentPassword: ['', Validators.required],
        newPassword: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', Validators.required],
      },
      {
        validators: [this.passwordMatchValidator, this.passwordDifferentValidator],
      },
    );
  }

  private passwordMatchValidator(form: FormGroup): { [key: string]: boolean } | null {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');

    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }

    return null;
  }

  private passwordDifferentValidator(form: FormGroup): { [key: string]: boolean } | null {
    const currentPassword = form.get('currentPassword');
    const newPassword = form.get('newPassword');

    if (
      currentPassword &&
      newPassword &&
      currentPassword.value &&
      newPassword.value === currentPassword.value
    ) {
      newPassword.setErrors({ passwordSame: true });
      return { passwordSame: true };
    }

    return null;
  }

  getPasswordStrength(): { strength: number; label: string; color: string } {
    const password = this.changePasswordForm.get('newPassword')?.value || '';

    if (!password) {
      return { strength: 0, label: '', color: '' };
    }

    let strength = 0;
    const criteria = {
      hasMinLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    strength = Object.values(criteria).filter(Boolean).length * 20;

    if (strength <= 40) {
      return { strength, label: 'Weak', color: '#dc2626' };
    } else if (strength <= 60) {
      return { strength, label: 'Fair', color: '#ea580c' };
    } else if (strength <= 80) {
      return { strength, label: 'Good', color: '#d97706' };
    } else {
      return { strength, label: 'Strong', color: '#16a34a' };
    }
  }

  onSubmit(): void {
    if (this.changePasswordForm.valid) {
      this.isLoading = true;
      const request: ChangePasswordRequest = {
        currentPassword: this.changePasswordForm.value.currentPassword,
        newPassword: this.changePasswordForm.value.newPassword,
        confirmPassword: this.changePasswordForm.value.confirmPassword,
      };

      this.authService.changePassword(request).subscribe({
        next: (response) => {
          console.log('🔐 [CHANGE PASSWORD] Response received:', response);

          // Backend returns { success: "message" } or { succeeded: true }
          const isSuccess =
            response.succeeded === true ||
            response.success ||
            (response && !response.succeeded && !response.error);

          if (isSuccess) {
            console.log('✅ [CHANGE PASSWORD] Password changed successfully');

            // Show success message
            const successMessage = `${this.languageService.t('auth.passwordChangedSuccess')} ${this.languageService.t('auth.loggingOut')}`;
            this.notificationService.showSuccess(successMessage);

            console.log('🔄 [CHANGE PASSWORD] Starting revoke all sessions...');

            // Revoke all other sessions for security, then logout
            this.authService
              .revokeAllSessions()
              .pipe(
                finalize(() => {
                  console.log('🧹 [CHANGE PASSWORD] Finalize block executing...');

                  // Clear all authentication data (tokens, user signals, etc.)
                  this.authService.clearAuthDataOnly();
                  console.log('✅ [CHANGE PASSWORD] Auth data cleared');

                  // Use window.location.href to avoid authGuard interference
                  // This forces a full page reload and navigation
                  const ecommerceCallback = encodeURIComponent(
                    `${environment.ecommerceUrl}/auth/callback?next=%2F`,
                  );
                  const loginUrl = `/auth/login?passwordChanged=true&returnUrl=${ecommerceCallback}`;
                  console.log('🚀 [CHANGE PASSWORD] Redirecting to:', loginUrl);
                  window.location.href = loginUrl;
                  console.log('✅ [CHANGE PASSWORD] Redirect command executed');
                }),
              )
              .subscribe({
                next: () => {
                  console.log('✅ [CHANGE PASSWORD] Sessions revoked successfully');
                },
                error: (err) => {
                  console.error('❌ [CHANGE PASSWORD] Error revoking sessions:', err);
                  // finalize() will still run even on error
                },
              });
          } else {
            console.error('❌ [CHANGE PASSWORD] Password change failed:', response);
            this.isLoading = false;
            const errorMessage = response.message || response.error || 'Failed to change password';
            this.notificationService.showError(errorMessage);
          }
        },
        error: (err) => {
          console.error('❌ [CHANGE PASSWORD] Error changing password:', err);
          this.isLoading = false;
        },
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/profile/security']);
  }

  togglePasswordVisibility(field: 'current' | 'new' | 'confirm'): void {
    if (field === 'current') {
      this.hideCurrentPassword = !this.hideCurrentPassword;
    } else if (field === 'new') {
      this.hideNewPassword = !this.hideNewPassword;
    } else {
      this.hideConfirmPassword = !this.hideConfirmPassword;
    }
  }
}
