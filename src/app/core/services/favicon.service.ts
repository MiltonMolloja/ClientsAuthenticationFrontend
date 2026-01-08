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

    const faviconPath = environment.production ? 'favicon-prod.svg' : 'favicon-dev.svg';

    this.setFavicon(faviconPath);
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
