import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '@core/services/auth.service';
import { LanguageService } from '@core/services/language.service';
import { NotificationService } from '@core/services/notification.service';

@Component({
  selector: 'app-backup-codes-dialog',
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './backup-codes-dialog.html',
  styleUrl: './backup-codes-dialog.scss',
})
export class BackupCodesDialogComponent implements OnInit {
  backupCodes: string[] = [];
  isRegenerating = false;
  isLoading = true;

  constructor(
    private dialogRef: MatDialogRef<BackupCodesDialogComponent>,
    private authService: AuthService,
    private notificationService: NotificationService,
    public languageService: LanguageService
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
        this.notificationService.showError(
          error?.error?.message || 'Failed to load backup codes'
        );
      }
    });
  }

  handleCopyAllCodes(): void {
    const codesText = this.backupCodes.join('\n');
    navigator.clipboard.writeText(codesText).then(
      () => {
        this.notificationService.showSuccess(
          this.languageService.t('security.codesCopied')
        );
      },
      (err) => {
        this.notificationService.showError('Failed to copy codes');
      }
    );
  }

  handleDownloadCodes(): void {
    const content = `${this.languageService.t('security.backupCodesTitle')}\n\n${this.backupCodes.join('\n')}\n\n${this.languageService.t('security.backupCodesWarning')}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '2fa-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
    this.notificationService.showSuccess(
      this.languageService.t('security.codesDownloaded')
    );
  }

  handleRegenerateCodes(): void {
    this.isRegenerating = true;

    this.authService.regenerateBackupCodes().subscribe({
      next: (response) => {
        if (response.backupCodes && Array.isArray(response.backupCodes)) {
          this.backupCodes = response.backupCodes;
        }
        this.isRegenerating = false;
        this.notificationService.showSuccess(
          this.languageService.t('security.codesRegenerated')
        );
      },
      error: (error) => {
        this.isRegenerating = false;
        this.notificationService.showError(
          error?.error?.message || 'Failed to regenerate backup codes'
        );
      }
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}
