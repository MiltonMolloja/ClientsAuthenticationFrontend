import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '@core/services/auth.service';
import { LanguageService } from '@core/services/language.service';
import { NotificationService } from '@core/services/notification.service';
import { RegenerateCodesDialogComponent } from '@shared/components/regenerate-codes-dialog/regenerate-codes-dialog';

@Component({
  selector: 'app-backup-codes-dialog',
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './backup-codes-dialog.html',
  styleUrl: './backup-codes-dialog.scss',
})
export class BackupCodesDialogComponent implements OnInit {
  backupCodes: string[] = [];
  isRegenerating = false;
  isLoading = true;

  private dialog = inject(MatDialog);

  constructor(
    private dialogRef: MatDialogRef<BackupCodesDialogComponent>,
    private authService: AuthService,
    private notificationService: NotificationService,
    public languageService: LanguageService,
  ) {}

  ngOnInit(): void {
    this.loadBackupCodes();
  }

  loadBackupCodes(): void {
    this.isLoading = true;
    this.authService.getBackupCodes().subscribe({
      next: (response) => {
        if (response.backupCodes && Array.isArray(response.backupCodes)) {
          this.backupCodes = response.backupCodes;
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.notificationService.showError(error?.error?.message || 'Failed to load backup codes');
      },
    });
  }

  handleCopyAllCodes(): void {
    const codesText = this.backupCodes.join('\n');
    this.copyTextToClipboard(codesText).then((success) => {
      if (success) {
        this.notificationService.showSuccess(this.languageService.t('security.codesCopied'));
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
    const title = this.languageService.t('security.backupCodesTitle');
    const warning = this.languageService.t('security.backupCodesWarning');

    // Abrir ventana para imprimir/guardar (funciona en HTTP)
    const printWindow = window.open('', '_blank', 'width=400,height=500');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${title}</title>
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
              <h1>🔐 ${title}</h1>
              <div class="codes">
                ${this.backupCodes.map((code) => `<div class="code">${code}</div>`).join('')}
              </div>
              <div class="warning">
                ⚠️ ${warning}
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
      this.notificationService.showSuccess(this.languageService.t('security.codesDownloaded'));
    } else {
      this.handleCopyAllCodes();
      this.notificationService.showInfo(
        'Popup bloqueado. Los códigos fueron copiados al portapapeles.',
      );
    }
  }

  handleRegenerateCodes(): void {
    const dialogRef = this.dialog.open(RegenerateCodesDialogComponent, {
      width: '500px',
      maxWidth: '90vw',
      disableClose: false,
      autoFocus: true,
    });

    dialogRef.afterClosed().subscribe((newCodes) => {
      // If newCodes is returned, update the current codes
      if (newCodes && Array.isArray(newCodes)) {
        this.backupCodes = newCodes;
      }
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}
