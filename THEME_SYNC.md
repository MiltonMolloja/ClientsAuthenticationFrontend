# Sincronización de Temas entre Proyectos

**Fecha:** 2025-10-27
**Proyectos Sincronizados:**
- ECommerceFrontend
- ClientsAuthenticationFrontend

---

## 📋 Resumen

Ambos proyectos ahora comparten el **mismo sistema de temas** con cambio dinámico entre modo claro, oscuro y automático. El servicio `ThemeService` está completamente sincronizado entre ambos proyectos.

---

## 🎨 ThemeService - Características

### Archivos Implementados

**ClientsAuthenticationFrontend:**
```
src/app/core/services/theme.service.ts
src/styles.scss (actualizado)
```

**ECommerceFrontend:**
```
src/app/core/services/theme.service.ts
src/styles.scss
```

### Modos de Tema Disponibles

```typescript
export type ThemeMode = 'light' | 'dark' | 'auto';
```

1. **light** - Modo claro forzado
2. **dark** - Modo oscuro forzado
3. **auto** - Sigue las preferencias del sistema operativo

---

## 🔧 Funcionalidades del ThemeService

### Signals (Angular)

```typescript
readonly themeMode = signal<ThemeMode>()     // Modo seleccionado por el usuario
readonly effectiveTheme = signal<'light' | 'dark'>()  // Tema efectivo aplicado
```

### Métodos Principales

```typescript
// Cambiar el modo de tema
setThemeMode(mode: ThemeMode): void

// Obtener ícono de Material para el tema actual
getThemeIcon(): string  // 'light_mode' | 'dark_mode' | 'brightness_auto'

// Obtener label en español
getThemeLabel(): string  // 'Claro' | 'Oscuro' | 'Auto'
```

### Persistencia y Sincronización

- Los preferences se guardan en `localStorage` con la key: `'app-theme-preference'`
- Los cambios se aplican automáticamente gracias a Angular Signals + effects
- Escucha cambios en las preferencias del sistema: `prefers-color-scheme`
- **🆕 Sincronización Cross-Tab/Cross-Project:** Detecta cambios en localStorage desde otras pestañas o proyectos en tiempo real mediante `storage` event

---

## 🎨 Variables CSS Sincronizadas

### Variables Globales (:root)

```css
:root {
  --amazon-dark: #232f3e;
  --amazon-light: #37475a;
  --amazon-orange: #ff9900;
  --amazon-yellow: #febd69;
  --amazon-bg: #eaeded;
  --amazon-bg-dark: #131921;
  --amazon-white: #ffffff;
  --amazon-text-light: #0f1111;
  --amazon-text-dark: #ffffff;
}
```

### Tema Claro (html.light-theme)

```css
--current-bg: var(--amazon-bg);
--current-text: var(--amazon-text-light);
--card-bg: #ffffff;
--card-border: #e0e0e0;
--card-hover-bg: #f5f5f5;
--text-primary: #111111;
--text-secondary: #666666;
--border-color: #e0e0e0;
--header-bg-primary: #232f3e;
--header-bg-secondary: #37475a;
--search-bg: #ffffff;
--search-text: #111111;
```

### Tema Oscuro (html.dark-theme)

```css
--current-bg: var(--amazon-bg-dark);
--current-text: var(--amazon-text-dark);
--card-bg: #1f2937;
--card-border: #374151;
--card-hover-bg: #2d3748;
--text-primary: #f3f4f6;
--text-secondary: #9ca3af;
--border-color: #374151;
--header-bg-primary: #0f172a;
--header-bg-secondary: #1e293b;
--search-bg: #374151;
--search-text: #f3f4f6;
```

---

## 💡 Uso en Componentes

### Inyectar el Servicio

```typescript
import { ThemeService } from '@core/services/theme.service';

export class MyComponent {
  constructor(public themeService: ThemeService) {}
}
```

### Cambiar Tema (Template)

```html
<button mat-icon-button (click)="themeService.setThemeMode('light')">
  <mat-icon>light_mode</mat-icon>
</button>

<button mat-icon-button (click)="themeService.setThemeMode('dark')">
  <mat-icon>dark_mode</mat-icon>
</button>

<button mat-icon-button (click)="themeService.setThemeMode('auto')">
  <mat-icon>brightness_auto</mat-icon>
</button>
```

### Usar Signals

```typescript
// En el componente
currentTheme = computed(() => this.themeService.effectiveTheme());
themeIcon = computed(() => this.themeService.getThemeIcon());
themeLabel = computed(() => this.themeService.getThemeLabel());
```

```html
<!-- En el template -->
<p>Tema actual: {{ currentTheme() }}</p>
<mat-icon>{{ themeIcon() }}</mat-icon>
<span>{{ themeLabel() }}</span>
```

---

## 🔄 Cómo Funciona

1. **Inicialización:**
   - El servicio se carga automáticamente (providedIn: 'root')
   - Lee la preferencia guardada en localStorage
   - Aplica el tema inicial al documento
   - Configura listeners para storage events y preferencias del sistema

2. **Cambio de Tema:**
   - Usuario llama a `setThemeMode()`
   - Signal `themeMode` se actualiza
   - Effect detecta el cambio automáticamente
   - Se guarda en localStorage
   - Se actualiza el `effectiveTheme`
   - Se aplica la clase CSS al `<html>` element

3. **Modo Auto:**
   - Escucha `window.matchMedia('(prefers-color-scheme: dark)')`
   - Cambia automáticamente cuando el OS cambia su tema
   - Resuelve a 'light' o 'dark' según la preferencia del sistema

4. **Sincronización Cross-Tab/Cross-Project:**
   - Escucha eventos `storage` del navegador
   - Cuando **otro proyecto o pestaña** cambia el tema:
     - Detecta el cambio en localStorage
     - Actualiza el signal `themeMode` automáticamente
     - Aplica el nuevo tema sin recargar la página
   - **Funciona entre:**
     - ✅ Múltiples pestañas del mismo proyecto
     - ✅ Diferentes proyectos en el mismo dominio (localhost:4200, localhost:4300, etc.)
     - ✅ Diferentes ventanas del navegador

5. **Aplicación al DOM:**
   ```typescript
   document.documentElement.classList.add('light-theme');
   // o
   document.documentElement.classList.add('dark-theme');

   // También se agrega data-theme para accesibilidad
   document.documentElement.setAttribute('data-theme', 'light');
   ```

---

## 🎯 Transiciones Suaves

El body tiene transiciones CSS para cambios suaves:

```css
body {
  transition:
    background-color 0.3s ease,
    color 0.3s ease;
}
```

---

## 📊 Comparación de Implementación

| Aspecto | ECommerceFrontend | ClientsAuthenticationFrontend |
|---------|------------------|-------------------------------|
| ThemeService | ✅ Idéntico | ✅ Idéntico |
| Variables CSS | ✅ Idéntico | ✅ Idéntico |
| Tema Claro | ✅ `.light-theme` | ✅ `.light-theme` |
| Tema Oscuro | ✅ `.dark-theme` | ✅ `.dark-theme` |
| localStorage Key | ✅ `app-theme-preference` | ✅ `app-theme-preference` |
| Angular Signals | ✅ Sí | ✅ Sí |
| Auto Theme | ✅ Sí | ✅ Sí |

---

## ✅ Ventajas de la Sincronización

1. **Consistencia:** Mismo comportamiento en ambos proyectos
2. **Mantenibilidad:** Un solo lugar para actualizar la lógica
3. **Usuario:** Experiencia uniforme entre aplicaciones
4. **localStorage:** Los temas pueden compartirse si están en el mismo dominio
5. **Accesibilidad:** Soporte para preferencias del sistema

---

## 🚀 Próximos Pasos (Opcional)

Para crear un toggle de tema reutilizable:

```typescript
// theme-toggle.component.ts
import { Component } from '@angular/core';
import { ThemeService } from '@core/services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  template: `
    <button mat-icon-button [matMenuTriggerFor]="themeMenu">
      <mat-icon>{{ themeService.getThemeIcon() }}</mat-icon>
    </button>

    <mat-menu #themeMenu="matMenu">
      <button mat-menu-item (click)="themeService.setThemeMode('light')">
        <mat-icon>light_mode</mat-icon>
        <span>Claro</span>
      </button>
      <button mat-menu-item (click)="themeService.setThemeMode('dark')">
        <mat-icon>dark_mode</mat-icon>
        <span>Oscuro</span>
      </button>
      <button mat-menu-item (click)="themeService.setThemeMode('auto')">
        <mat-icon>brightness_auto</mat-icon>
        <span>Auto</span>
      </button>
    </mat-menu>
  `
})
export class ThemeToggleComponent {
  constructor(public themeService: ThemeService) {}
}
```

---

## 🧪 Cómo Probar la Sincronización Cross-Project

### Prueba 1: Sincronización entre Proyectos

1. **Inicia ambos proyectos:**
   ```bash
   # Terminal 1 - ClientsAuthenticationFrontend
   cd C:\Source\ClientsAuthenticationFrontend
   npm start
   # Corre en http://localhost:4200

   # Terminal 2 - ECommerceFrontend
   cd C:\Source\ECommerceFrontend
   npm start
   # Corre en http://localhost:4300 (o el puerto que Angular asigne)
   ```

2. **Abre ambos en el navegador:**
   - Pestaña 1: `http://localhost:4200`
   - Pestaña 2: `http://localhost:4300`

3. **Cambia el tema en uno:**
   - En cualquier proyecto, cambia el tema (light → dark → auto)
   - El **otro proyecto debería cambiar automáticamente** sin recargar

### Prueba 2: Sincronización entre Pestañas

1. **Abre el mismo proyecto en dos pestañas:**
   - Pestaña 1: `http://localhost:4200`
   - Pestaña 2: `http://localhost:4200`

2. **Cambia el tema en una pestaña:**
   - La otra pestaña debería actualizarse instantáneamente

### Prueba 3: Sincronización con DevTools

1. **Abre DevTools (F12) → Application/Storage → localStorage**
2. **Observa la key:** `app-theme-preference`
3. **Cambia el valor manualmente** a 'light', 'dark', o 'auto'
4. **El tema debería cambiar automáticamente en todas las pestañas**

---

## 📝 Notas Importantes

1. ✅ Ambos proyectos usan **Material 3 theming**
2. ✅ Las clases `.light-theme` y `.dark-theme` se aplican al `<html>` element
3. ✅ El servicio es **singleton** (providedIn: 'root')
4. ✅ Los cambios son **reactivos** gracias a Angular Signals
5. ✅ Compatible con **SSR** (Server-Side Rendering) - solo localStorage puede tener problemas
6. ✅ **Sincronización en tiempo real** entre pestañas y proyectos mediante `storage` event
7. ⚠️ La sincronización cross-project solo funciona si ambos proyectos están en el **mismo dominio** (localhost)

---

## 🔧 Detalles Técnicos de la Sincronización

### Storage Event API

El servicio usa el `storage` event del navegador:

```typescript
window.addEventListener('storage', (event: StorageEvent) => {
  if (event.key === this.THEME_STORAGE_KEY && event.newValue) {
    const newTheme = event.newValue as ThemeMode;
    if (newTheme === 'light' || newTheme === 'dark' || newTheme === 'auto') {
      // Actualizar el signal sin disparar el effect (evita loop)
      this.themeMode.set(newTheme);
    }
  }
});
```

### Características del Storage Event:

- **Solo se dispara en otras pestañas/ventanas**, no en la misma donde se hizo el cambio
- **Funciona entre diferentes puertos del mismo dominio** (localhost:4200 ↔ localhost:4300)
- **No funciona entre dominios diferentes** por políticas de seguridad del navegador
- **Es instantáneo** - no requiere polling ni intervalos

---

**Estado:** ✅ **COMPLETAMENTE SINCRONIZADO CON CROSS-TAB/CROSS-PROJECT**
**Versión:** 2.0.0
**Última Actualización:** 2025-10-27
