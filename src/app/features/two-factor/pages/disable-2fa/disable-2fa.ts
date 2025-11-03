import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';
import { DashboardLayoutComponent } from '@shared/components/dashboard-layout/dashboard-layout';
import { LanguageService } from '@core/services/language.service';
import { CodeInput } from '@shared/components/code-input/code-input';

@Component({
  selector: 'app-disable2fa',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    DashboardLayoutComponent,
    CodeInput
  ],
  templateUrl: './disable-2fa.html',
  styleUrl: './disable-2fa.scss',
})
export class Disable2FA implements OnInit {
  disableForm!: FormGroup;
  isLoading = false;
  showPassword = false;
  success = false;
  verificationCode: string = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService,
    public languageService: LanguageService
  ) {}

  ngOnInit(): void {
    this.disableForm = this.fb.group({
      password: ['', [Validators.required]],
      code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
    });
  }

  onCodeComplete(code: string): void {
    this.verificationCode = code;
    this.disableForm.patchValue({ code });
  }

  onSubmit(): void {
    if (this.disableForm.valid) {
      this.isLoading = true;

      const userId = this.authService.currentUser?.id;
      if (!userId) {
        this.notificationService.showError('User not found');
        this.isLoading = false;
        return;
      }

      const request = {
        userId: userId,
        password: this.disableForm.value.password,
        code: this.disableForm.value.code
      };

      this.authService.disable2FA(request).subscribe({
        next: () => {
          this.isLoading = false;
          this.success = true;
          this.notificationService.showSuccess('2FA disabled successfully!');

          // Refresh token to update JWT
          this.authService.refreshToken().subscribe({
            next: () => {
              setTimeout(() => {
                this.router.navigate(['/profile/security']);
              }, 2000);
            },
            error: () => {
              setTimeout(() => {
                this.router.navigate(['/profile/security']);
              }, 2000);
            }
          });
        },
        error: (err) => {
          this.isLoading = false;
          const errorMessage = err?.error?.message || 'Failed to disable 2FA';
          this.notificationService.showError(errorMessage);
        }
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/profile/security']);
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
}
