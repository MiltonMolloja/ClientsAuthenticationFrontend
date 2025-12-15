import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ThemeToggle } from '../theme-toggle/theme-toggle';
import { LanguageToggle } from '../language-toggle/language-toggle';
import { LanguageService } from '@core/services/language.service';

@Component({
  selector: 'app-auth-layout',
  imports: [
    CommonModule,
    RouterLink,
    MatIconModule,
    ThemeToggle,
    LanguageToggle
  ],
  templateUrl: './auth-layout.html',
  styleUrl: './auth-layout.scss'
})
export class AuthLayoutComponent {
  public languageService = inject(LanguageService);
  currentYear = new Date().getFullYear();
}
