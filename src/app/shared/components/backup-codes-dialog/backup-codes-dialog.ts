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
    MatProgressSpinnerModule
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
    const dialogRef = this.dialog.open(RegenerateCodesDialogComponent, {
      width: '500px',
      maxWidth: '90vw',
      disableClose: false,
      autoFocus: true
    });

    dialogRef.afterClosed().subscribe(newCodes => {
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
