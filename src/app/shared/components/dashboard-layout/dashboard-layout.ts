import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '@core/services/auth.service';
import { LanguageService } from '@core/services/language.service';
import { ThemeToggle } from '../theme-toggle/theme-toggle';
import { LanguageToggle } from '../language-toggle/language-toggle';
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
    ThemeToggle,
    LanguageToggle,
  ],
  templateUrl: './dashboard-layout.html',
  styleUrl: './dashboard-layout.scss',
})
export class DashboardLayoutComponent implements OnInit {
  private authService = inject(AuthService);
  public languageService = inject(LanguageService);

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
}
