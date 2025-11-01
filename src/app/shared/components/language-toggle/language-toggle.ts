import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { LanguageService } from '@core/services/language.service';

@Component({
  selector: 'app-language-toggle',
  standalone: true,
  imports: [
    MatIconModule,
    MatButtonModule,
    MatMenuModule
  ],
  templateUrl: './language-toggle.html',
  styleUrl: './language-toggle.scss',
})
export class LanguageToggle {
  public languageService = inject(LanguageService);

  setLanguage(lang: 'es' | 'en'): void {
    this.languageService.setLanguage(lang);
  }
}
