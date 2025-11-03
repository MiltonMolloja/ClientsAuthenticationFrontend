import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';

import { AuthService } from '@core/services/auth.service';
import { LanguageService } from '@core/services/language.service';
import { NotificationService } from '@core/services/notification.service';
import { DashboardLayoutComponent } from '@shared/components/dashboard-layout/dashboard-layout';
import { RegenerateCodesDialogComponent } from '@shared/components/regenerate-codes-dialog/regenerate-codes-dialog';

@Component({
  selector: 'app-backup-codes',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    DashboardLayoutComponent
  ],
  templateUrl: './backup-codes.html',
  styleUrl: './backup-codes.scss',
})
export class BackupCodes implements OnInit {
  backupCodes: string[] = [];
  isLoading = true;
  private dialog = inject(MatDialog);

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router,
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
        // Redirect back to security settings on error
        setTimeout(() => {
          this.router.navigate(['/profile/security']);
        }, 2000);
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

  goBack(): void {
    this.router.navigate(['/profile/security']);
  }
}
