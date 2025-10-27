import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';

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
    if (this.strength < 40) return 'Weak';
    if (this.strength < 80) return 'Medium';
    return 'Strong';
  }

  get strengthColor(): 'warn' | 'accent' | 'primary' {
    if (this.strength < 40) return 'warn';
    if (this.strength < 80) return 'accent';
    return 'primary';
  }

  get criteria(): PasswordCriteria[] {
    return [
      { met: this.hasMinLength, text: 'At least 8 characters' },
      { met: this.hasUppercase, text: 'One uppercase letter' },
      { met: this.hasLowercase, text: 'One lowercase letter' },
      { met: this.hasNumber, text: 'One number' },
      { met: this.hasSpecialChar, text: 'One special character' }
    ];
  }
}
