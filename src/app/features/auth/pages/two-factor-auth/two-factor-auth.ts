import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';

import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';
import { LanguageService } from '@core/services/language.service';
import { TwoFactorAuthRequest } from '@core/models/auth.model';
import { CodeInput } from '@shared/components/code-input/code-input';
import { AuthLayoutComponent } from '@shared/components/auth-layout/auth-layout';

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
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    CodeInput,
    AuthLayoutComponent
  ],
  templateUrl: './two-factor-auth.html',
  styleUrl: './two-factor-auth.scss',
})
export class TwoFactorAuth implements OnInit {
  userId: string = '';
  rememberDevice = false;
  isLoading = false;
  useBackupCode = false;
  code = '';
  backupCode = '';
  error = '';
  attemptsLeft = 3;

  constructor(
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService,
    public languageService: LanguageService
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
    this.code = code;
    this.handleSubmit(code);
  }

  handleSubmit(submittedCode?: string): void {
    this.error = '';
    const codeToVerify = submittedCode || (this.useBackupCode ? this.backupCode : this.code);

    if (!codeToVerify) {
      this.error = this.languageService.t('twoFactorAuth.error.required') || 'Por favor ingresa el código';
      return;
    }

    if (!this.useBackupCode && codeToVerify.length !== 6) {
      this.error = this.languageService.t('twoFactorAuth.error.invalid6digits') || 'El código debe tener 6 dígitos';
      return;
    }

    if (this.useBackupCode && codeToVerify.length < 8) {
      this.error = this.languageService.t('twoFactorAuth.error.invalidBackup') || 'El código de respaldo no es válido';
      return;
    }

    this.verify2FA(codeToVerify);
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
          this.notificationService.showSuccess(
            this.languageService.t('twoFactorAuth.success') || 'Autenticación exitosa'
          );
          this.router.navigate(['/profile']);
        } else {
          const newAttempts = this.attemptsLeft - 1;
          this.attemptsLeft = newAttempts;

          if (newAttempts > 0) {
            this.error = this.languageService.t('twoFactorAuth.error.incorrectCode')
              ?.replace('{attempts}', newAttempts.toString())
              || `Código incorrecto. Te quedan ${newAttempts} intento(s)`;
            this.notificationService.showError(
              this.languageService.t('twoFactorAuth.error.incorrect') || 'Código incorrecto'
            );
          } else {
            this.error = this.languageService.t('twoFactorAuth.error.locked')
              || 'Demasiados intentos fallidos. Tu sesión ha sido bloqueada.';
            this.notificationService.showError(
              this.languageService.t('twoFactorAuth.error.accountLocked') || 'Cuenta bloqueada'
            );
            setTimeout(() => this.router.navigate(['/auth/login']), 2000);
          }

          this.isLoading = false;
          this.code = '';
          this.backupCode = '';
        }
      },
      error: () => {
        const newAttempts = this.attemptsLeft - 1;
        this.attemptsLeft = newAttempts;

        if (newAttempts > 0) {
          this.error = this.languageService.t('twoFactorAuth.error.incorrectCode')
            ?.replace('{attempts}', newAttempts.toString())
            || `Código incorrecto. Te quedan ${newAttempts} intento(s)`;
        } else {
          this.error = this.languageService.t('twoFactorAuth.error.locked')
            || 'Demasiados intentos fallidos. Tu sesión ha sido bloqueada.';
          setTimeout(() => this.router.navigate(['/auth/login']), 2000);
        }

        this.isLoading = false;
        this.code = '';
        this.backupCode = '';
      }
    });
  }

  toggleBackupCode(): void {
    this.useBackupCode = !this.useBackupCode;
    this.code = '';
    this.backupCode = '';
    this.error = '';
  }

  onBackupCodeKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && this.backupCode) {
      this.handleSubmit();
    }
  }
}
