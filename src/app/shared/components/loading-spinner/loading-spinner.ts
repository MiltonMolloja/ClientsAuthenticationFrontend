import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LoadingService } from '@core/services/loading.service';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  template: `
    @if (loadingService.loading()) {
      <div class="loading-overlay">
        <div class="loading-container">
          <mat-spinner diameter="60"></mat-spinner>
          <p class="loading-text">Loading...</p>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        backdrop-filter: blur(2px);
      }

      .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        background: var(--card-bg);
        padding: 2rem;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      }

      .loading-text {
        margin: 0;
        color: var(--text-primary);
        font-size: 1rem;
        font-weight: 500;
      }

      ::ng-deep .mat-mdc-progress-spinner circle {
        stroke: var(--amazon-orange) !important;
      }
    `,
  ],
})
export class LoadingSpinnerComponent {
  loadingService = inject(LoadingService);
}
