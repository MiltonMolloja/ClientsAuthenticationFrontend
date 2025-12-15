import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  private loadingSignal = signal<boolean>(false);
  private loadingCountSignal = signal<number>(0);

  /**
   * Get loading state as signal
   */
  get loading() {
    return this.loadingSignal.asReadonly();
  }

  /**
   * Show loading spinner
   */
  show(): void {
    this.loadingCountSignal.update((count) => count + 1);
    this.loadingSignal.set(true);
  }

  /**
   * Hide loading spinner
   */
  hide(): void {
    this.loadingCountSignal.update((count) => Math.max(0, count - 1));

    // Only hide if no more pending requests
    if (this.loadingCountSignal() === 0) {
      this.loadingSignal.set(false);
    }
  }

  /**
   * Force hide loading (reset counter)
   */
  forceHide(): void {
    this.loadingCountSignal.set(0);
    this.loadingSignal.set(false);
  }
}
