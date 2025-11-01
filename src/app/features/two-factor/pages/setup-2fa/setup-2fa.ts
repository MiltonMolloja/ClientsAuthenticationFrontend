import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';
import { Enable2FAResponse, Verify2FARequest } from '@core/models/auth.model';
import { DashboardLayoutComponent } from '@shared/components/dashboard-layout/dashboard-layout';

@Component({
  selector: 'app-setup-2fa',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    DashboardLayoutComponent
  ],
  templateUrl: './setup-2fa.html',
  styleUrl: './setup-2fa.scss',
})
export class Setup2FA implements OnInit {
  step = 1;
  isLoading = false;
  verifyForm!: FormGroup;
  setupData: Enable2FAResponse | null = null;
  copiedSecret = false;
  copiedCodes = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.verifyForm = this.fb.group({
      code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
    });

    this.loadSetupData();
  }

  loadSetupData(): void {
    // Mock setup data for now
    this.setupData = {
      succeeded: true,
      secret: 'JBSWY3DPEHPK3PXP',
      qrCodeUri: 'otpauth://totp/AuthApp:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=AuthApp',
      backupCodes: [
        'A1B2C3D4',
        'E5F6G7H8',
        'I9J0K1L2',
        'M3N4O5P6',
        'Q7R8S9T0',
        'U1V2W3X4',
        'Y5Z6A7B8',
        'C9D0E1F2',
        'G3H4I5J6',
        'K7L8M9N0'
      ]
    };

    // TODO: Get from API
    // this.authService.enable2FA().subscribe({
    //   next: (response) => {
    //     this.setupData = response;
    //   },
    //   error: () => {
    //     this.notificationService.showError('Failed to load 2FA setup data');
    //   }
    // });
  }

  nextStep(): void {
    if (this.step < 3) {
      this.step++;
    }
  }

  previousStep(): void {
    if (this.step > 1) {
      this.step--;
    }
  }

  onVerifyCode(): void {
    if (this.verifyForm.valid) {
      this.isLoading = true;
      const request: Verify2FARequest = {
        code: this.verifyForm.value.code
      };

      // Mock verification
      setTimeout(() => {
        this.isLoading = false;
        this.notificationService.showSuccess('Code verified successfully!');
        this.step = 3;
      }, 1500);

      // TODO: Implement actual verification
      // this.authService.verify2FA(request).subscribe({
      //   next: (response) => {
      //     this.isLoading = false;
      //     if (response.succeeded) {
      //       this.notificationService.showSuccess('Code verified successfully!');
      //       this.step = 3;
      //     } else {
      //       this.notificationService.showError(response.message || 'Invalid code');
      //     }
      //   },
      //   error: () => {
      //     this.isLoading = false;
      //   }
      // });
    }
  }

  copyToClipboard(text: string, type: 'secret' | 'codes'): void {
    navigator.clipboard.writeText(text).then(() => {
      if (type === 'secret') {
        this.copiedSecret = true;
        setTimeout(() => (this.copiedSecret = false), 2000);
      } else {
        this.copiedCodes = true;
        setTimeout(() => (this.copiedCodes = false), 2000);
      }
      this.notificationService.showSuccess('Copied to clipboard!');
    });
  }

  downloadBackupCodes(): void {
    if (!this.setupData) return;

    const content = `AuthApp Backup Codes\n\n${this.setupData.backupCodes.join('\n')}\n\nKeep these codes in a safe place.`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'authapp-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  completeSetup(): void {
    this.router.navigate(['/profile/security']);
  }

  getStepIcon(stepNumber: number): string {
    if (stepNumber < this.step) {
      return 'check_circle';
    }
    return '';
  }

  isStepActive(stepNumber: number): boolean {
    return stepNumber === this.step;
  }

  isStepCompleted(stepNumber: number): boolean {
    return stepNumber < this.step;
  }
}
