import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';

/**
 * Servicio para gestionar el favicon dinámicamente según el entorno.
 * - Producción: favicon verde
 * - Desarrollo: favicon amarillo
 */
@Injectable({
  providedIn: 'root',
})
export class FaviconService {
  private readonly platformId = inject(PLATFORM_ID);

  /**
   * Inicializa el favicon según el entorno actual
   */
  init(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const isProd = this.checkProdMode();
    const faviconPath = isProd ? 'favicon-prod.svg' : 'favicon-dev.svg';

    this.setFavicon(faviconPath);
  }

  /**
   * Verifica si está en modo producción usando window.__env en runtime
   */
  private checkProdMode(): boolean {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as Window & { __env?: Record<string, any> };
    // Check if explicitly set in window.__env (Docker runtime)
    if (w.__env?.['production'] !== undefined) {
      const prod = w.__env['production'];
      // Handle both boolean and string values
      return prod === true || prod === 'true';
    }
    // Fall back to environment.production (build time)
    return environment.production;
  }

  /**
   * Establece el favicon de la página
   */
  private setFavicon(path: string): void {
    const link: HTMLLinkElement =
      document.querySelector("link[rel*='icon']") || document.createElement('link');

    link.type = 'image/svg+xml';
    link.rel = 'icon';
    link.href = path;

    const head = document.getElementsByTagName('head')[0];
    if (head) {
      head.appendChild(link);
    }
  }
}
