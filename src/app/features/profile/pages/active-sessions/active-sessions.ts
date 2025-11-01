import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { Session } from '@core/models/session.model';
import { AuthService } from '@core/services/auth.service';
import { LanguageService } from '@core/services/language.service';
import { DashboardLayoutComponent } from '@shared/components/dashboard-layout/dashboard-layout';
import { ConfirmDialog } from '@shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-active-sessions',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    DashboardLayoutComponent
  ],
  templateUrl: './active-sessions.html',
  styleUrl: './active-sessions.scss',
})
export class ActiveSessions implements OnInit {
  sessions = signal<Session[]>([]);
  isLoading = signal<boolean>(true);

  constructor(
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    public languageService: LanguageService
  ) {}

  ngOnInit(): void {
    this.loadSessions();
  }

  loadSessions(): void {
    this.isLoading.set(true);
    this.authService.getSessions().subscribe({
      next: (response) => {
        // Convert API response to Session model
        // API returns { sessions: [...] }
        if (response.sessions && Array.isArray(response.sessions)) {
          const sessions = response.sessions.map((session: any) => ({
            id: session.id,
            deviceInfo: session.deviceInfo || 'Unknown Device',
            ipAddress: session.ipAddress || 'Unknown IP',
            createdAt: new Date(session.createdAt),
            expiresAt: new Date(session.expiresAt),
            isCurrent: session.isCurrent || false,
            refreshToken: session.refreshToken
          }));
          this.sessions.set(sessions);
        }

        this.isLoading.set(false);
      },
      error: (error) => {
        this.isLoading.set(false);
        const message = this.languageService.t('common.error');
        this.snackBar.open(message, 'OK', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
        });
      }
    });
  }

  getDeviceIcon(deviceInfo: string): string {
    const lowerDeviceInfo = deviceInfo.toLowerCase();
    if (lowerDeviceInfo.includes('iphone') || lowerDeviceInfo.includes('android')) {
      return 'smartphone';
    }
    if (lowerDeviceInfo.includes('ipad') || lowerDeviceInfo.includes('tablet')) {
      return 'tablet_mac';
    }
    if (lowerDeviceInfo.includes('windows') || lowerDeviceInfo.includes('mac') || lowerDeviceInfo.includes('linux')) {
      return 'computer';
    }
    return 'devices';
  }

  parseUserAgent(userAgent: string): { device: string; browser: string } {
    const ua = userAgent.toLowerCase();

    // Detect Device
    let device = 'Unknown Device';
    if (ua.includes('windows nt 10')) device = 'Windows 10/11';
    else if (ua.includes('windows nt 6.3')) device = 'Windows 8.1';
    else if (ua.includes('windows nt 6.2')) device = 'Windows 8';
    else if (ua.includes('windows nt 6.1')) device = 'Windows 7';
    else if (ua.includes('windows')) device = 'Windows';
    else if (ua.includes('macintosh') || ua.includes('mac os x')) device = 'macOS';
    else if (ua.includes('linux')) device = 'Linux';
    else if (ua.includes('iphone')) device = 'iPhone';
    else if (ua.includes('ipad')) device = 'iPad';
    else if (ua.includes('android')) device = 'Android';

    // Detect Browser
    let browser = 'Unknown Browser';
    if (ua.includes('postman')) browser = 'Postman';
    else if (ua.includes('edg/')) browser = 'Edge';
    else if (ua.includes('opr/') || ua.includes('opera')) browser = 'Opera';
    else if (ua.includes('chrome/') && !ua.includes('edg')) browser = 'Chrome';
    else if (ua.includes('safari/') && !ua.includes('chrome')) browser = 'Safari';
    else if (ua.includes('firefox/')) browser = 'Firefox';
    else if (ua.includes('msie') || ua.includes('trident/')) browser = 'Internet Explorer';

    return { device, browser };
  }

  getFormattedDeviceInfo(deviceInfo: string): string {
    const { device, browser } = this.parseUserAgent(deviceInfo);
    return `${device} - ${browser}`;
  }

  revokeSession(session: Session): void {
    this.authService.revokeSession(session.id).subscribe({
      next: () => {
        // Remove session from local list
        const updatedSessions = this.sessions().filter(s => s.id !== session.id);
        this.sessions.set(updatedSessions);

        const message = this.languageService.t('sessions.revokeSuccess');
        this.snackBar.open(message, 'OK', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
        });
      },
      error: (error) => {
        const message = this.languageService.t('common.error');
        this.snackBar.open(message, 'OK', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
        });
      }
    });
  }

  revokeAllSessions(): void {
    const dialogRef = this.dialog.open(ConfirmDialog, {
      width: '400px',
      panelClass: 'confirm-dialog-container',
      data: {
        title: this.languageService.t('sessions.revokeAllConfirmTitle'),
        message: this.languageService.t('sessions.revokeAllConfirmMessage'),
        confirmText: this.languageService.t('sessions.revokeAllConfirmButton'),
        cancelText: this.languageService.t('common.cancel'),
        color: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.authService.revokeAllSessions().subscribe({
          next: () => {
            // Keep only current session
            const updatedSessions = this.sessions().filter(s => s.isCurrent);
            this.sessions.set(updatedSessions);

            const message = this.languageService.t('sessions.revokeAllSuccess');
            this.snackBar.open(message, 'OK', {
              duration: 3000,
              horizontalPosition: 'center',
              verticalPosition: 'top',
            });
          },
          error: (error) => {
            const message = this.languageService.t('common.error');
            this.snackBar.open(message, 'OK', {
              duration: 5000,
              horizontalPosition: 'center',
              verticalPosition: 'top',
            });
          }
        });
      }
    });
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString();
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString();
  }

  get nonCurrentSessions(): Session[] {
    return this.sessions().filter(s => !s.isCurrent);
  }
}
