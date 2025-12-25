import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TokenService } from '@core/services/token.service';

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
  styles: [
    `
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
    `,
  ],
})
export class Logout implements OnInit {
  private tokenService = inject(TokenService);
  private route = inject(ActivatedRoute);

  ngOnInit(): void {
    // Obtener returnUrl de los query params
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');

    console.log('=== LOGOUT PAGE ===');
    console.log('returnUrl:', returnUrl);
    console.log('Full URL:', window.location.href);

    // Limpiar tokens locales directamente
    this.tokenService.clearTokens();

    // Emitir evento de logout para sincronizar con otras aplicaciones
    localStorage.setItem('auth_logout_event', 'true');
    setTimeout(() => localStorage.removeItem('auth_logout_event'), 1000);

    // Redirigir después de un pequeño delay para asegurar que todo se limpió
    setTimeout(() => {
      console.log('Redirecting to:', returnUrl ? decodeURIComponent(returnUrl) : '/login');
      if (returnUrl) {
        window.location.href = decodeURIComponent(returnUrl);
      } else {
        window.location.href = '/login';
      }
    }, 100);
  }
}
