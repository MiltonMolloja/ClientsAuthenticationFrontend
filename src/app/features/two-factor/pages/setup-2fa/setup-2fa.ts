import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
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
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';

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
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    DashboardLayoutComponent,
    CodeInput,
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
  backupCodesSaved: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService,
    public languageService: LanguageService,
  ) {}

  ngOnInit(): void {
    this.verifyForm = this.fb.group({
      code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
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
      },
    });
  }

  async generateQRCode(): Promise<void> {
    if (!this.setupData || !this.qrCanvas) return;

    try {
      // Lazy load QRCode library
      const QRCode = (await import('qrcode')).default;

      const canvas = this.qrCanvas.nativeElement;
      await QRCode.toCanvas(canvas, this.setupData.qrCodeUri, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
    } catch (error) {
      console.error('Error generating QR code:', error);
      this.notificationService.showError('Failed to generate QR code');
    }
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
        },
      });
    }
  }

  onCodeComplete(code: string): void {
    this.verificationCode = code;
    this.isLoading = true;

    this.authService.verify2FA(code).subscribe({
      next: (response) => {
        this.isLoading = false;
        // Check if response has succeeded property, otherwise assume success
        const isSuccess = response.succeeded !== undefined ? response.succeeded : true;

        if (isSuccess) {
          this.notificationService.showSuccess('Code verified successfully!');
          // Advance to step 3 (backup codes)
          setTimeout(() => {
            this.step = 3;
          }, 500);
        } else {
          this.notificationService.showError(response.message || 'Invalid code');
        }
      },
      error: (err) => {
        this.isLoading = false;
        const errorMessage = err?.error?.message || err?.message || 'Failed to verify code';
        this.notificationService.showError(errorMessage);
      },
    });
  }

  copyToClipboard(text: string, type: 'secret' | 'codes'): void {
    this.copyTextToClipboard(text).then((success) => {
      if (success) {
        if (type === 'secret') {
          this.copiedSecret = true;
          setTimeout(() => (this.copiedSecret = false), 2000);
        } else {
          this.copiedCodes = true;
          setTimeout(() => (this.copiedCodes = false), 2000);
        }
        this.notificationService.showSuccess('Copiado al portapapeles!');
      } else {
        this.notificationService.showError('No se pudo copiar al portapapeles');
      }
    });
  }

  private copyTextToClipboard(text: string): Promise<boolean> {
    // Usar Clipboard API si está disponible (requiere HTTPS)
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      return navigator.clipboard
        .writeText(text)
        .then(() => true)
        .catch(() => this.fallbackCopyText(text));
    }
    // Fallback para HTTP o navegadores antiguos
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

  downloadBackupCodes(): void {
    if (!this.setupData) return;

    const codes = this.setupData.backupCodes.join('\n');
    const content = `Códigos de Respaldo 2FA\n${'='.repeat(30)}\n\n${codes}\n\n${'='.repeat(30)}\nGuarda estos códigos en un lugar seguro.\nFecha: ${new Date().toLocaleString()}`;

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
                ${this.setupData.backupCodes.map((code) => `<div class="code">${code}</div>`).join('')}
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
      this.notificationService.showSuccess('Ventana abierta - Usa Imprimir > Guardar como PDF');
    } else {
      // Fallback: copiar al portapapeles
      this.copyToClipboard(codes, 'codes');
      this.notificationService.showInfo(
        'Popup bloqueado. Los códigos fueron copiados al portapapeles.',
      );
    }
  }

  completeSetup(): void {
    // Refresh token to get updated JWT with TwoFactorEnabled: true
    this.authService.refreshToken().subscribe({
      next: () => {
        this.notificationService.showSuccess('2FA enabled successfully!');
        this.router.navigate(['/profile/security']);
      },
      error: () => {
        // Even if refresh fails, navigate to security page
        this.router.navigate(['/profile/security']);
      },
    });
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
