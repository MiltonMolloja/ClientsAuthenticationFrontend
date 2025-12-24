import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
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
  private router = inject(Router);
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

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/auth/login']);
      },
    });
  }
}
