import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { LanguageService } from '@core/services/language.service';

interface PasswordCriteria {
  met: boolean;
  text: string;
}

@Component({
  selector: 'app-password-strength',
  imports: [CommonModule, MatProgressBarModule, MatIconModule],
  templateUrl: './password-strength.html',
  styleUrl: './password-strength.scss',
})
export class PasswordStrength {
  @Input() password: string = '';

  public languageService = inject(LanguageService);

  get hasMinLength(): boolean {
    return this.password.length >= 8;
  }

  get hasUppercase(): boolean {
    return /[A-Z]/.test(this.password);
  }

  get hasLowercase(): boolean {
    return /[a-z]/.test(this.password);
  }

  get hasNumber(): boolean {
    return /\d/.test(this.password);
  }

  get hasSpecialChar(): boolean {
    return /[!@#$%^&*(),.?":{}|<>]/.test(this.password);
  }

  get strength(): number {
    let score = 0;
    if (this.hasMinLength) score += 20;
    if (this.hasUppercase) score += 20;
    if (this.hasLowercase) score += 20;
    if (this.hasNumber) score += 20;
    if (this.hasSpecialChar) score += 20;
    return score;
  }

  get strengthLabel(): string {
    if (this.strength < 40) return this.languageService.t('passwordStrength.weak');
    if (this.strength < 80) return this.languageService.t('passwordStrength.medium');
    return this.languageService.t('passwordStrength.strong');
  }

  get strengthColor(): 'warn' | 'accent' | 'primary' {
    if (this.strength < 40) return 'warn';
    if (this.strength < 80) return 'accent';
    return 'primary';
  }

  get criteria(): PasswordCriteria[] {
    return [
      { met: this.hasMinLength, text: this.languageService.t('passwordStrength.minLength') },
      { met: this.hasUppercase, text: this.languageService.t('passwordStrength.uppercase') },
      { met: this.hasLowercase, text: this.languageService.t('passwordStrength.lowercase') },
      { met: this.hasNumber, text: this.languageService.t('passwordStrength.number') },
      { met: this.hasSpecialChar, text: this.languageService.t('passwordStrength.specialChar') },
    ];
  }
}
