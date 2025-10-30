import { Injectable, signal, effect } from '@angular/core';

export type ThemeMode = 'light' | 'dark' | 'auto';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_STORAGE_KEY = 'app-theme-preference';

  // Signal para el modo de tema seleccionado por el usuario
  readonly themeMode = signal<ThemeMode>(this.getStoredTheme());

  // Signal para el tema efectivo (resuelve 'auto' a 'light' o 'dark')
  readonly effectiveTheme = signal<'light' | 'dark'>('light');

  private mediaQuery: MediaQueryList;
  private isExternalUpdate = false; // Flag para evitar guardar cuando viene de storage event

  constructor() {
    console.log('🎨 ThemeService constructor called');

    // Configurar listener para cambios en preferencias del sistema
    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.mediaQuery.addEventListener('change', () => this.updateEffectiveTheme());

    // Listener para sincronización cross-tab/cross-project
    // Detecta cambios en localStorage desde otras pestañas o proyectos
    window.addEventListener('storage', (event: StorageEvent) => {
      console.log('📢 Storage event detected:', event.key, event.newValue);

      if (event.key === this.THEME_STORAGE_KEY && event.newValue) {
        const newTheme = event.newValue as ThemeMode;
        console.log('🔄 Theme storage key matched, new value:', newTheme);

        if (newTheme === 'light' || newTheme === 'dark' || newTheme === 'auto') {
          // Marcar como actualización externa para evitar guardar de nuevo
          this.isExternalUpdate = true;
          this.themeMode.set(newTheme);
          this.isExternalUpdate = false;
          console.log('✅ Theme synced from another tab/project:', newTheme);
        }
      }
    });

    console.log('✅ Storage event listener registered');

    // Effect para aplicar el tema cuando cambia
    effect(() => {
      const mode = this.themeMode();
      console.log('🎭 Effect triggered, current mode:', mode, 'isExternal:', this.isExternalUpdate);

      // Solo guardar si no es una actualización externa
      if (!this.isExternalUpdate) {
        this.saveThemePreference(mode);
        console.log('💾 Theme saved to localStorage:', mode);
      }
      this.updateEffectiveTheme();
    });

    // Aplicar tema inicial
    this.updateEffectiveTheme();
  }

  /**
   * Cambia el modo de tema
   */
  setThemeMode(mode: ThemeMode): void {
    this.themeMode.set(mode);
  }

  /**
   * Obtiene la preferencia de tema guardada en localStorage
   */
  private getStoredTheme(): ThemeMode {
    const stored = localStorage.getItem(this.THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'auto') {
      return stored;
    }
    return 'auto'; // Default
  }

  /**
   * Guarda la preferencia de tema en localStorage
   */
  private saveThemePreference(mode: ThemeMode): void {
    localStorage.setItem(this.THEME_STORAGE_KEY, mode);
  }

  /**
   * Actualiza el tema efectivo basado en el modo seleccionado
   */
  private updateEffectiveTheme(): void {
    const mode = this.themeMode();
    let effective: 'light' | 'dark';

    if (mode === 'auto') {
      // Usar preferencias del sistema
      effective = this.mediaQuery.matches ? 'dark' : 'light';
    } else {
      effective = mode;
    }

    this.effectiveTheme.set(effective);
    this.applyThemeToDocument(effective);
  }

  /**
   * Aplica la clase de tema al documento
   */
  private applyThemeToDocument(theme: 'light' | 'dark'): void {
    const htmlElement = document.documentElement;

    // Remover clases de tema existentes
    htmlElement.classList.remove('light-theme', 'dark-theme');

    // Agregar la clase del tema actual
    htmlElement.classList.add(`${theme}-theme`);

    // Actualizar el atributo data-theme para mejor accesibilidad
    htmlElement.setAttribute('data-theme', theme);
  }

  /**
   * Obtiene el ícono de Material correspondiente al modo actual
   */
  getThemeIcon(): string {
    const mode = this.themeMode();
    switch (mode) {
      case 'light':
        return 'light_mode';
      case 'dark':
        return 'dark_mode';
      case 'auto':
        return 'brightness_auto';
    }
  }

  /**
   * Obtiene el label en español para el modo actual
   */
  getThemeLabel(): string {
    const mode = this.themeMode();
    switch (mode) {
      case 'light':
        return 'Claro';
      case 'dark':
        return 'Oscuro';
      case 'auto':
        return 'Auto';
    }
  }
}
