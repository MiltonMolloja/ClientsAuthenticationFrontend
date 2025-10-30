import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeToggle } from '../theme-toggle/theme-toggle';

@Component({
  selector: 'app-auth-layout',
  imports: [
    CommonModule,
    ThemeToggle
  ],
  templateUrl: './auth-layout.html',
  styleUrl: './auth-layout.scss'
})
export class AuthLayoutComponent {
  currentYear = new Date().getFullYear();
}
