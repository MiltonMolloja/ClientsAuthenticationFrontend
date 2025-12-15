import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '@core/services/auth.service';

/**
 * LogoutComponent
 * 
 * Maneja el logout y redirección de vuelta a la aplicación que lo solicitó
 * Query params:
 * - returnUrl: URL a la que redirigir después del logout
 */
@Component({
  selector: 'app-logout',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  template: `
    <div class="logout-container">
      <mat-spinner diameter="50"></mat-spinner>
      <p>Cerrando sesión...</p>
    </div>
  `,
  styles: [`
    .logout-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      gap: 1rem;
      
      p {
        font-size: 1.125rem;
        color: var(--text-secondary);
      }
    }
  `]
})
export class Logout implements OnInit {
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);

  ngOnInit(): void {
    // Obtener returnUrl de los query params
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    
    // Cerrar sesión
    this.authService.logout().subscribe({
      next: () => {
        // Redirigir de vuelta a la aplicación que solicitó el logout
        if (returnUrl) {
          window.location.href = decodeURIComponent(returnUrl);
        } else {
          // Si no hay returnUrl, ir al login
          window.location.href = '/auth/login';
        }
      },
      error: () => {
        // Incluso si hay error, redirigir
        if (returnUrl) {
          window.location.href = decodeURIComponent(returnUrl);
        } else {
          window.location.href = '/auth/login';
        }
      }
    });
  }
}
