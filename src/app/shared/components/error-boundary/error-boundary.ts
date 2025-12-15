import { Component, ErrorHandler, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { Router } from '@angular/router';
import { LoggerService } from '@core/services/logger.service';

@Component({
  selector: 'app-error-boundary',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatCardModule],
  template: `
    <div class="error-boundary">
      <mat-card class="error-card">
        <mat-card-header>
          <mat-icon class="error-icon">error_outline</mat-icon>
          <mat-card-title>Oops! Something went wrong</mat-card-title>
        </mat-card-header>

        <mat-card-content>
          <p>We're sorry, but something unexpected happened.</p>
          <p>Please try refreshing the page or go back to the home page.</p>
        </mat-card-content>

        <mat-card-actions>
          <button mat-raised-button color="primary" (click)="reload()">
            <mat-icon>refresh</mat-icon>
            Reload Page
          </button>
          <button mat-button (click)="goHome()">
            <mat-icon>home</mat-icon>
            Go Home
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .error-boundary {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        padding: 2rem;
        background: var(--current-bg);
      }

      .error-card {
        max-width: 500px;
        text-align: center;
      }

      .error-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        color: #f44336;
        margin: 0 auto 1rem;
      }

      mat-card-header {
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      mat-card-actions {
        display: flex;
        gap: 1rem;
        justify-content: center;
        padding: 1rem;
      }
    `,
  ],
})
export class ErrorBoundaryComponent {
  private router = inject(Router);

  reload(): void {
    window.location.reload();
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}

/**
 * Global Error Handler
 */
export class GlobalErrorHandler implements ErrorHandler {
  private logger = inject(LoggerService);

  handleError(error: Error): void {
    this.logger.error('Unhandled error', error);

    // In production, you might want to send this to an external service
    // like Sentry, LogRocket, etc.
  }
}
