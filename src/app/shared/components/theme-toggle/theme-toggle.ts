import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { ThemeService, ThemeMode } from '@core/services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  imports: [
    MatIconModule,
    MatButtonModule,
    MatMenuModule
  ],
  templateUrl: './theme-toggle.html',
  styleUrl: './theme-toggle.scss',
})
export class ThemeToggle {
  constructor(public themeService: ThemeService) {}

  setTheme(mode: ThemeMode): void {
    this.themeService.setThemeMode(mode);
  }
}
