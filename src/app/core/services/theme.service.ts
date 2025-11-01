import { Injectable, signal, computed, effect } from '@angular/core';

export type Theme = 'light' | 'dark' | 'auto';
export type ResolvedTheme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly STORAGE_KEY = 'theme';

  // Signal para el tema actual
  private themeSignal = signal<Theme>(this.getInitialTheme());

  // Signal para el tema resuelto (después de aplicar preferencias del sistema)
  private resolvedThemeSignal = signal<ResolvedTheme>('light');

  // Computed para exponer el tema actual (read-only)
  theme = computed(() => this.themeSignal());

  // Computed para exponer el tema resuelto (read-only)
  resolvedTheme = computed(() => this.resolvedThemeSignal());

  private mediaQuery?: MediaQueryList;

  constructor() {
    // Effect para guardar en localStorage cuando cambie el tema
    effect(() => {
      const currentTheme = this.themeSignal();
      localStorage.setItem(this.STORAGE_KEY, currentTheme);
      this.updateTheme();
    });

    // Inicializar el tema
    this.updateTheme();

    // Escuchar cambios en la preferencia del sistema si el tema es 'auto'
    this.setupMediaQueryListener();
  }

  /**
   * Obtiene el tema inicial desde localStorage o retorna 'auto' por defecto
   */
  private getInitialTheme(): Theme {
    const stored = localStorage.getItem(this.STORAGE_KEY) as Theme;
    return stored && ['light', 'dark', 'auto'].includes(stored) ? stored : 'auto';
  }

  /**
   * Configura el listener para cambios en las preferencias del sistema
   */
  private setupMediaQueryListener(): void {
    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handler = () => {
      if (this.themeSignal() === 'auto') {
        this.updateTheme();
      }
    };

    // Usar el método correcto según la disponibilidad
    if (this.mediaQuery.addEventListener) {
      this.mediaQuery.addEventListener('change', handler);
    } else {
      // Fallback para navegadores antiguos
      this.mediaQuery.addListener(handler);
    }
  }

  /**
   * Actualiza el tema aplicado al documento
   */
  private updateTheme(): void {
    const root = document.documentElement;
    let effectiveTheme: ResolvedTheme = 'light';

    if (this.themeSignal() === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      effectiveTheme = prefersDark ? 'dark' : 'light';
    } else {
      effectiveTheme = this.themeSignal() as ResolvedTheme;
    }

    this.resolvedThemeSignal.set(effectiveTheme);

    // Remover ambas clases primero
    root.classList.remove('light-theme', 'dark-theme');

    // Añadir la clase correspondiente
    if (effectiveTheme === 'dark') {
      root.classList.add('dark-theme');
    } else {
      root.classList.add('light-theme');
    }
  }

  /**
   * Cambia el tema actual
   */
  setTheme(theme: Theme): void {
    this.themeSignal.set(theme);
  }

  /**
   * Cicla entre los temas: light -> dark -> auto -> light
   */
  cycleTheme(): void {
    const themes: Theme[] = ['light', 'dark', 'auto'];
    const currentIndex = themes.indexOf(this.themeSignal());
    const nextIndex = (currentIndex + 1) % themes.length;
    this.setTheme(themes[nextIndex]);
  }

  /**
   * Obtiene el nombre del tema actual traducido
   */
  getThemeName(language: 'es' | 'en' = 'es'): string {
    const theme = this.themeSignal();
    const names = {
      es: { light: 'Claro', dark: 'Oscuro', auto: 'Automático' },
      en: { light: 'Light', dark: 'Dark', auto: 'Automatic' }
    };
    return names[language][theme];
  }

  /**
   * Obtiene el ícono del tema actual para Material Icons
   */
  getThemeIcon(): string {
    const theme = this.themeSignal();
    switch (theme) {
      case 'light':
        return 'light_mode';
      case 'dark':
        return 'dark_mode';
      case 'auto':
        return 'brightness_auto';
    }
  }
}
