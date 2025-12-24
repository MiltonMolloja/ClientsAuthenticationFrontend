import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
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
    CodeInput,
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
    printed: false,
  };

  // Saved confirmation
  savedCodes = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService,
    public languageService: LanguageService,
  ) {}

  ngOnInit(): void {
    this.regenerateForm = this.fb.group({
      password: ['', [Validators.required]],
      code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
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
        code: this.regenerateForm.value.code,
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
        },
      });
    }
  }

  handleCopyCodes(): void {
    const codesText = this.newBackupCodes.join('\n');
    this.copyTextToClipboard(codesText).then((success) => {
      if (success) {
        this.actionsTaken.copied = true;
        this.notificationService.showSuccess('Códigos de respaldo copiados!');
      } else {
        this.notificationService.showError('No se pudo copiar los códigos');
      }
    });
  }

  private copyTextToClipboard(text: string): Promise<boolean> {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      return navigator.clipboard
        .writeText(text)
        .then(() => true)
        .catch(() => this.fallbackCopyText(text));
    }
    return Promise.resolve(this.fallbackCopyText(text));
  }

  private fallbackCopyText(text: string): boolean {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    } catch (err) {
      document.body.removeChild(textArea);
      return false;
    }
  }

  handleDownloadCodes(): void {
    // Abrir ventana para imprimir/guardar (funciona en HTTP)
    const printWindow = window.open('', '_blank', 'width=400,height=500');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Códigos de Respaldo 2FA</title>
            <style>
              body { font-family: monospace; padding: 20px; background: #f5f5f5; }
              .container { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
              h1 { font-size: 18px; color: #333; margin-bottom: 20px; }
              .codes { background: #f9f9f9; padding: 15px; border-radius: 4px; margin: 15px 0; }
              .code { font-size: 16px; padding: 5px 0; letter-spacing: 2px; }
              .warning { color: #856404; background: #fff3cd; padding: 10px; border-radius: 4px; margin-top: 15px; font-size: 12px; }
              .actions { margin-top: 20px; text-align: center; }
              button { padding: 10px 20px; margin: 5px; cursor: pointer; border: none; border-radius: 4px; }
              .print-btn { background: #007bff; color: white; }
              .close-btn { background: #6c757d; color: white; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>🔐 Códigos de Respaldo 2FA</h1>
              <div class="codes">
                ${this.newBackupCodes.map((code) => `<div class="code">${code}</div>`).join('')}
              </div>
              <div class="warning">
                ⚠️ Guarda estos códigos en un lugar seguro. Los necesitarás si pierdes acceso a tu aplicación de autenticación.
              </div>
              <div class="actions">
                <button class="print-btn" onclick="window.print()">🖨️ Imprimir / Guardar PDF</button>
                <button class="close-btn" onclick="window.close()">Cerrar</button>
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      this.actionsTaken.downloaded = true;
      this.notificationService.showSuccess('Ventana abierta - Usa Imprimir > Guardar como PDF');
    } else {
      this.handleCopyCodes();
      this.notificationService.showInfo(
        'Popup bloqueado. Los códigos fueron copiados al portapapeles.',
      );
    }
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
      this.newBackupCodes.forEach((code) => {
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
        this.notificationService.showWarning(
          'Please confirm that you have saved your backup codes before leaving.',
        );
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
