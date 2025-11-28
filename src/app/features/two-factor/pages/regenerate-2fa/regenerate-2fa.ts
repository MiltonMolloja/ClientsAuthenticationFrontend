import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';
import { DashboardLayoutComponent } from '@shared/components/dashboard-layout/dashboard-layout';
import { LanguageService } from '@core/services/language.service';
import { CodeInput } from '@shared/components/code-input/code-input';

type Step = 'confirm' | 'success';

@Component({
  selector: 'app-regenerate-2fa',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    DashboardLayoutComponent,
    CodeInput
  ],
  templateUrl: './regenerate-2fa.html',
  styleUrl: './regenerate-2fa.scss',
})
export class Regenerate2FA implements OnInit {
  step: Step = 'confirm';
  regenerateForm!: FormGroup;
  isRegenerating = false;
  showPassword = false;
  verificationCode: string = '';

  // Confirmation state
  understood = false;

  // New backup codes
  newBackupCodes: string[] = [];

  // Action tracking
  actionsTaken = {
    copied: false,
    downloaded: false,
    printed: false
  };

  // Saved confirmation
  savedCodes = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService,
    public languageService: LanguageService
  ) {}

  ngOnInit(): void {
    this.regenerateForm = this.fb.group({
      password: ['', [Validators.required]],
      code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
    });
  }

  onCodeComplete(code: string): void {
    this.verificationCode = code;
    this.regenerateForm.patchValue({ code });
  }

  canRegenerateSubmit(): boolean {
    return this.regenerateForm.valid && this.understood;
  }

  onRegenerateSubmit(): void {
    if (this.canRegenerateSubmit()) {
      this.isRegenerating = true;

      const userId = this.authService.currentUser?.id;
      const request = {
        userId: userId,
        password: this.regenerateForm.value.password,
        code: this.regenerateForm.value.code
      };

      this.authService.regenerateBackupCodes(request).subscribe({
        next: (response) => {
          this.isRegenerating = false;
          this.newBackupCodes = response.backupCodes || [];
          this.step = 'success';
          this.notificationService.showSuccess('Backup codes regenerated successfully!');
        },
        error: (err) => {
          this.isRegenerating = false;
          const errorMessage = err?.error?.message || 'Failed to regenerate backup codes';
          this.notificationService.showError(errorMessage);
        }
      });
    }
  }

  handleCopyCodes(): void {
    const codesText = this.newBackupCodes.join('\n');
    navigator.clipboard.writeText(codesText).then(() => {
      this.actionsTaken.copied = true;
      this.notificationService.showSuccess('Backup codes copied to clipboard!');
    }).catch(() => {
      this.notificationService.showError('Failed to copy codes');
    });
  }

  handleDownloadCodes(): void {
    const codesText = this.newBackupCodes.join('\n');
    const blob = new Blob([codesText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup-codes-${new Date().getTime()}.txt`;
    link.click();
    window.URL.revokeObjectURL(url);
    this.actionsTaken.downloaded = true;
    this.notificationService.showSuccess('Backup codes downloaded!');
  }

  handlePrintCodes(): void {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write('<html><head><title>Backup Codes</title>');
      printWindow.document.write('<style>body { font-family: monospace; padding: 20px; }</style>');
      printWindow.document.write('</head><body>');
      printWindow.document.write('<h1>Backup Codes</h1>');
      printWindow.document.write('<p>Keep these codes in a safe place:</p>');
      printWindow.document.write('<ul>');
      this.newBackupCodes.forEach(code => {
        printWindow.document.write(`<li>${code}</li>`);
      });
      printWindow.document.write('</ul>');
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      printWindow.print();
      this.actionsTaken.printed = true;
      this.notificationService.showSuccess('Print dialog opened!');
    }
  }

  canGoBack(): boolean {
    return this.step === 'confirm' || (this.step === 'success' && this.savedCodes);
  }

  onBack(): void {
    if (this.step === 'confirm') {
      this.router.navigate(['/profile/security']);
    } else if (this.step === 'success') {
      if (this.savedCodes) {
        this.router.navigate(['/profile/security']);
      } else {
        this.notificationService.showWarning('Please confirm that you have saved your backup codes before leaving.');
      }
    }
  }

  onCancel(): void {
    this.router.navigate(['/profile/security']);
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  getStepLabel(stepName: Step): string {
    return stepName === 'confirm' ? 'Verification' : 'New Codes';
  }

  isCurrentStep(stepName: Step): boolean {
    return this.step === stepName;
  }

  isCompletedStep(stepName: Step): boolean {
    const steps: Step[] = ['confirm', 'success'];
    const currentIndex = steps.indexOf(this.step);
    const stepIndex = steps.indexOf(stepName);
    return stepIndex < currentIndex;
  }
}
