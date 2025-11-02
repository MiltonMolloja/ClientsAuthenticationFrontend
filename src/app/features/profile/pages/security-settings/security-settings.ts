import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTableModule } from '@angular/material/table';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { User } from '@core/models/user.model';
import { AuditLog } from '@core/models/audit-log.model';
import { AuthService } from '@core/services/auth.service';
import { LanguageService } from '@core/services/language.service';
import { NotificationService } from '@core/services/notification.service';
import { DashboardLayoutComponent } from '@shared/components/dashboard-layout/dashboard-layout';
import { BackupCodesDialogComponent } from '@shared/components/backup-codes-dialog/backup-codes-dialog';

@Component({
  selector: 'app-security-settings',
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatTableModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    DashboardLayoutComponent
  ],
  templateUrl: './security-settings.html',
  styleUrl: './security-settings.scss',
})
export class SecuritySettings implements OnInit {
  user: User | null = null;
  auditLogs: AuditLog[] = [];
  displayedColumns: string[] = ['action', 'timestamp', 'ipAddress', 'status'];

  constructor(
    private authService: AuthService,
    private router: Router,
    private dialog: MatDialog,
    private notificationService: NotificationService,
    public languageService: LanguageService
  ) {}

  ngOnInit(): void {
    // Get user from auth service
    this.user = this.authService.currentUser;

    // Load activity logs
    this.loadActivity();
  }

  loadActivity(): void {
    this.authService.getActivity(20).subscribe({
      next: (response) => {
        // Convert API response to AuditLog model
        if (response.activities && Array.isArray(response.activities)) {
          this.auditLogs = response.activities.map((activity: any, index: number) => ({
            id: index + 1,
            action: activity.action,
            timestamp: new Date(activity.timestamp),
            ipAddress: activity.ipAddress || 'Unknown IP',
            userAgent: activity.userAgent || 'Unknown',
            success: activity.success,
            failureReason: activity.failureReason
          }));
        }
      },
      error: (error) => {
        // Error loading activity
      }
    });
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString();
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString();
  }

  getDaysSincePasswordChange(): number {
    if (!this.user?.passwordChangedAt) {
      return 0;
    }

    const passwordChangedDate = new Date(this.user.passwordChangedAt);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - passwordChangedDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  }

  navigateTo2FA(): void {
    console.log('Navigating to 2FA setup...', this.user?.twoFactorEnabled);
    if (this.user?.twoFactorEnabled) {
      this.router.navigate(['/2fa/disable']);
    } else {
      this.router.navigate(['/2fa/setup']);
    }
  }

  viewBackupCodes(): void {
    const dialogRef = this.dialog.open(BackupCodesDialogComponent, {
      width: '800px',
      maxWidth: '90vw',
      disableClose: false,
      autoFocus: true
    });

    dialogRef.afterClosed().subscribe(result => {
      // Handle dialog close if needed
      console.log('Backup codes dialog closed');
    });
  }
}
