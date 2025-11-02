import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
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
import QRCode from 'qrcode';

import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';
import { Enable2FAResponse } from '@core/models/auth.model';
import { DashboardLayoutComponent } from '@shared/components/dashboard-layout/dashboard-layout';
import { LanguageService } from '@core/services/language.service';
import { CodeInput } from '@shared/components/code-input/code-input';

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
    DashboardLayoutComponent,
    CodeInput
  ],
  templateUrl: './setup-2fa.html',
  styleUrl: './setup-2fa.scss',
})
export class Setup2FA implements OnInit, AfterViewInit {
  @ViewChild('qrCanvas', { static: false }) qrCanvas!: ElementRef<HTMLCanvasElement>;

  step = 1;
  isLoading = false;
  verifyForm!: FormGroup;
  setupData: Enable2FAResponse | null = null;
  copiedSecret = false;
  copiedCodes = false;
  verificationCode: string = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService,
    public languageService: LanguageService
  ) {}

  ngOnInit(): void {
    this.verifyForm = this.fb.group({
      code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
    });

    this.loadSetupData();
  }

  ngAfterViewInit(): void {
    // Generate QR code after view is initialized
    if (this.setupData && this.step === 1) {
      this.generateQRCode();
    }
  }

  loadSetupData(): void {
    this.isLoading = true;
    this.authService.enable2FA().subscribe({
      next: (response) => {
        this.setupData = response;
        this.isLoading = false;
        // Generate QR code if canvas is ready
        setTimeout(() => this.generateQRCode(), 100);
      },
      error: () => {
        this.isLoading = false;
        this.notificationService.showError('Failed to load 2FA setup data');
      }
    });
  }

  generateQRCode(): void {
    if (!this.setupData || !this.qrCanvas) return;

    const canvas = this.qrCanvas.nativeElement;
    QRCode.toCanvas(canvas, this.setupData.qrCodeUri, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    }, (error) => {
      if (error) {
        console.error('Error generating QR code:', error);
        this.notificationService.showError('Failed to generate QR code');
      }
    });
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
      const code = this.verifyForm.value.code;

      this.authService.verify2FA(code).subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.succeeded) {
            this.notificationService.showSuccess('Code verified successfully!');
            this.step = 3;
          } else {
            this.notificationService.showError(response.message || 'Invalid code');
          }
        },
        error: () => {
          this.isLoading = false;
          this.notificationService.showError('Failed to verify code');
        }
      });
    }
  }

  onCodeComplete(code: string): void {
    this.verificationCode = code;
    this.isLoading = true;

    // Simulate API call with timeout to match design reference
    this.authService.verify2FA(code).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.succeeded) {
          this.notificationService.showSuccess('Code verified successfully!');
          // Advance to step 3 (backup codes)
          setTimeout(() => {
            this.step = 3;
          }, 500);
        } else {
          this.notificationService.showError(response.message || 'Invalid code');
        }
      },
      error: () => {
        this.isLoading = false;
        this.notificationService.showError('Failed to verify code');
      }
    });
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
