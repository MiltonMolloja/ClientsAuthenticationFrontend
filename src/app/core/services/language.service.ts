import { Injectable, signal, computed, effect } from '@angular/core';
import { translations, Language as LanguageType } from './translations';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private readonly STORAGE_KEY = 'language';

  // Signal para el idioma actual
  private languageSignal = signal<LanguageType>(this.getInitialLanguage());

  // Computed para exponer el idioma actual (read-only)
  language = computed(() => this.languageSignal());

  constructor() {
    // Effect para guardar en localStorage cuando cambie el idioma
    effect(() => {
      const currentLang = this.languageSignal();
      localStorage.setItem(this.STORAGE_KEY, currentLang);
    });
  }

  /**
   * Obtiene el idioma inicial desde localStorage o retorna 'es' por defecto
   */
  private getInitialLanguage(): LanguageType {
    const stored = localStorage.getItem(this.STORAGE_KEY) as LanguageType;
    return stored && (stored === 'es' || stored === 'en') ? stored : 'es';
  }

  /**
   * Cambia el idioma actual
   */
  setLanguage(lang: LanguageType): void {
    this.languageSignal.set(lang);
  }

  /**
   * Alterna entre español e inglés
   */
  toggleLanguage(): void {
    const current = this.languageSignal();
    this.setLanguage(current === 'es' ? 'en' : 'es');
  }

  /**
   * Obtiene una traducción por su clave
   * Ejemplo: t('profile.title') retorna 'Resumen de Cuenta' en español
   */
  t(key: string): string {
    const keys = key.split('.');
    const currentLang = this.languageSignal();
    let value: any = translations[currentLang];

    for (const k of keys) {
      value = value?.[k];
    }

    return value || key;
  }

  /**
   * Obtiene el nombre del idioma actual en su propio idioma
   */
  getLanguageName(): string {
    return this.languageSignal() === 'es' ? 'Español' : 'English';
  }
}
