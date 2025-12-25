import { Component, OnInit, signal, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '@core/services/auth.service';
import { ThemeService } from '@core/services/theme.service';
import { ThemeToggle } from '../theme-toggle/theme-toggle';
import { LanguageToggle } from '../language-toggle/language-toggle';
import { LanguageService } from '@core/services/language.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatSidenavModule,
    MatListModule,
    MatDividerModule,
    ThemeToggle,
    LanguageToggle,
  ],
  templateUrl: './dashboard-layout.html',
  styleUrl: './dashboard-layout.scss',
})
export class DashboardLayoutComponent implements OnInit {
  private authService = inject(AuthService);
  public languageService = inject(LanguageService);
  public themeService = inject(ThemeService);

  // ViewChild para el sidenav móvil
  @ViewChild('mobileDrawer') mobileDrawer!: MatSidenav;

  // Signal para controlar el estado del drawer móvil
  readonly isMobileDrawerOpen = signal(false);

  currentYear = new Date().getFullYear();
  userFirstName = signal<string>('John');
  userEmail = signal<string>('john.doe@example.com');
  ecommerceUrl = environment.ecommerceUrl;

  ngOnInit(): void {
    // Get user info from auth service
    const user = this.authService.currentUser;
    if (user) {
      this.userFirstName.set(user.firstName || 'User');
      this.userEmail.set(user.email || '');
    }
  }

  /**
   * Logout - limpia tokens locales y redirige al Frontend para que también limpie sus tokens
   */
  logout(): void {
    // Limpiar tokens de Auth (4400) sin navegar
    this.authService.logout(false).subscribe({
      next: () => {
        // Redirigir al Frontend para que limpie sus tokens y vuelva a la home
        window.location.href = `${this.ecommerceUrl}/logout`;
      },
      error: () => {
        // Incluso si hay error, redirigir
        window.location.href = `${this.ecommerceUrl}/logout`;
      },
    });
  }

  /**
   * Abre el drawer móvil
   */
  openMobileDrawer(): void {
    this.isMobileDrawerOpen.set(true);
    this.mobileDrawer?.open();
  }

  /**
   * Cierra el drawer móvil
   */
  closeMobileDrawer(): void {
    this.isMobileDrawerOpen.set(false);
    this.mobileDrawer?.close();
  }

  /**
   * Toggle del drawer móvil
   */
  toggleMobileDrawer(): void {
    if (this.isMobileDrawerOpen()) {
      this.closeMobileDrawer();
    } else {
      this.openMobileDrawer();
    }
  }

  /**
   * Logout y cierra el drawer
   */
  logoutAndClose(): void {
    this.closeMobileDrawer();
    this.logout();
  }
}
