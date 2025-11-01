import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { User } from '@core/models/user.model';
import { AuthService } from '@core/services/auth.service';
import { LanguageService } from '@core/services/language.service';
import { ThemeService } from '@core/services/theme.service';
import { DashboardLayoutComponent } from '@shared/components/dashboard-layout/dashboard-layout';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatButtonToggleModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    DashboardLayoutComponent
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile implements OnInit {
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  public languageService = inject(LanguageService);
  public themeService = inject(ThemeService);

  user = signal<User | null>(null);
  isLoading = signal<boolean>(false); // Cambiado a false - datos disponibles inmediatamente
  loadError = signal<string | null>(null);
  isResendingEmail = signal<boolean>(false);

  ngOnInit(): void {
    this.loadUserDataFromToken();
  }

  /**
   * Carga los datos del usuario desde el JWT decodificado (sin llamada a API)
   * Los datos en el JWT son la fuente de verdad para información básica del usuario,
   * incluyendo el estado de verificación de email (emailConfirmed).
   */
  private loadUserDataFromToken(): void {
    const currentUser = this.authService.currentUser;

    if (currentUser) {
      this.user.set(currentUser);
    } else {
      this.loadError.set('No user data available. Please login again.');
    }

    // No hay loading porque los datos están inmediatamente disponibles
    this.isLoading.set(false);
  }

  /**
   * Reenvía el email de confirmación
   */
  resendVerificationEmail(): void {
    const currentUser = this.user();
    if (!currentUser || !currentUser.email) {
      return;
    }

    this.isResendingEmail.set(true);

    this.authService.resendEmailConfirmation(currentUser.email).subscribe({
      next: () => {
        this.isResendingEmail.set(false);
        const message = this.languageService.t('profile.verificationEmailSent');
        this.snackBar.open(message || 'Verification email sent successfully!', 'OK', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
        });
      },
      error: (error) => {
        this.isResendingEmail.set(false);
        const message = this.languageService.t('profile.verificationEmailError');
        this.snackBar.open(message || 'Error sending verification email', 'OK', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
        });
      }
    });
  }

  onThemeChange(theme: 'light' | 'dark' | 'auto'): void {
    this.themeService.setTheme(theme);
  }

  onLanguageChange(language: 'es' | 'en'): void {
    this.languageService.setLanguage(language);
  }

  getThemeIcon(): string {
    return this.themeService.getThemeIcon();
  }

  refreshUserData(): void {
    this.loadUserDataFromToken();
  }

  getDaysSincePasswordChange(): number {
    const currentUser = this.user();
    if (!currentUser?.passwordChangedAt) {
      return 0;
    }

    const passwordChangedDate = new Date(currentUser.passwordChangedAt);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - passwordChangedDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  }
}
