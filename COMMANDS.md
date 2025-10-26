# Comandos Útiles - Identity Frontend

## Desarrollo

### Servidor de Desarrollo
```bash
# Iniciar servidor en puerto por defecto (4200)
npm start

# Iniciar en puerto específico
npm start -- --port 4300

# Abrir automáticamente en el navegador
npm start -- --open

# Modo verbose
npm start -- --verbose
```

### Build

```bash
# Build de desarrollo
npm run build

# Build de producción
npm run build -- --configuration production

# Build con análisis de bundle
npm run build -- --stats-json
```

### Watch Mode
```bash
# Compilar en modo watch (detecta cambios)
npm run watch
```

## Testing

```bash
# Ejecutar todos los tests
npm test

# Tests en modo watch
npm test -- --watch

# Tests con coverage
npm test -- --code-coverage

# Tests de un archivo específico
npm test -- --include='**/auth.service.spec.ts'
```

## Linting y Formato

```bash
# Ejecutar ESLint
npm run lint

# Fix automático de ESLint
npm run lint:fix

# Formatear código con Prettier
npm run format

# Verificar formato sin modificar archivos
npm run format:check
```

## Angular CLI

### Generar Componentes
```bash
# Componente standalone en shared
ng generate component shared/components/loading-spinner --standalone

# Componente en un feature
ng generate component features/auth/login --standalone

# Componente con módulo de routing
ng generate component features/profile/view --standalone --flat
```

### Generar Servicios
```bash
# Servicio en core
ng generate service core/services/user

# Servicio con providedIn específico
ng generate service core/services/token --skip-tests
```

### Generar Guards
```bash
# Functional guard
ng generate guard core/guards/role --functional

# Guard con múltiples interfaces
ng generate guard core/guards/auth --functional --implements CanActivate
```

### Generar Interceptors
```bash
# Functional interceptor
ng generate interceptor core/interceptors/loading --functional
```

### Generar Pipes
```bash
# Pipe standalone
ng generate pipe shared/pipes/safe-html --standalone
```

### Generar Directives
```bash
# Directive standalone
ng generate directive shared/directives/auto-focus --standalone
```

### Generar Interfaces/Models
```bash
# Interface
ng generate interface core/models/response

# Enum
ng generate enum core/models/user-status
```

## Git

```bash
# Ver estado
git status

# Añadir cambios
git add .

# Commit
git commit -m "feat: descripción del cambio"

# Ver log
git log --oneline

# Ver diferencias
git diff
```

## NPM

```bash
# Instalar dependencias
npm install

# Instalar dependencia de producción
npm install <package-name>

# Instalar dependencia de desarrollo
npm install <package-name> --save-dev

# Actualizar dependencias
npm update

# Listar dependencias desactualizadas
npm outdated

# Auditoría de seguridad
npm audit

# Fix de vulnerabilidades
npm audit fix
```

## Path Aliases

El proyecto tiene configurados los siguientes path mappings:

```typescript
import { AuthService } from '@core/services/auth.service';
import { UserModel } from '@core/models/user.model';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { LoginComponent } from '@features/auth/login/login.component';
import { HeaderComponent } from '@layout/header/header.component';
import { environment } from '@environments/environment';
```

## Debugging

### Chrome DevTools
```bash
# Iniciar con source maps
npm start -- --source-map
```

### VS Code Launch Configuration

Ya está configurado en `.vscode/launch.json`:
- Presiona F5 para iniciar debugging
- Establece breakpoints en el código TypeScript
- Inspecciona variables y estado

## Producción

### Build Optimizado
```bash
# Build de producción con optimizaciones
npm run build -- --configuration production

# Build con stats para análisis
npm run build -- --configuration production --stats-json

# Analizar bundle
npx webpack-bundle-analyzer dist/identity-frontend/stats.json
```

### Servir Build de Producción Localmente
```bash
# Instalar http-server globalmente (solo una vez)
npm install -g http-server

# Servir archivos de dist
cd dist/identity-frontend
http-server -p 8080
```

## Limpieza

```bash
# Limpiar node_modules
rm -rf node_modules
npm install

# Limpiar cache de Angular
rm -rf .angular

# Limpiar todo y reinstalar
rm -rf node_modules package-lock.json .angular
npm install
```

## Actualización de Angular

```bash
# Ver actualizaciones disponibles
ng update

# Actualizar Angular CLI
ng update @angular/cli

# Actualizar Angular Core
ng update @angular/core

# Actualizar Angular Material
ng update @angular/material

# Actualizar todo
ng update @angular/cli @angular/core @angular/material
```

## Variables de Entorno

### Development
```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:10000'
};
```

### Production
```typescript
// src/environments/environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://api.yourdomain.com'
};
```

## Snippets Útiles

### Componente Standalone Básico
```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-example',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './example.component.html',
  styleUrl: './example.component.scss'
})
export class ExampleComponent {
  // Component logic
}
```

### Servicio con Signals
```typescript
import { Injectable, signal, computed } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private dataSignal = signal<Data[]>([]);

  data = this.dataSignal.asReadonly();
  count = computed(() => this.dataSignal().length);

  addData(item: Data) {
    this.dataSignal.update(data => [...data, item]);
  }
}
```

### Functional Guard
```typescript
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/auth/login']);
};
```

### HTTP Interceptor
```typescript
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '@core/services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req);
};
```

## Performance

### Analizar Performance
```bash
# Lighthouse CI
npm install -g @lhci/cli

# Ejecutar lighthouse
lhci autorun
```

### Bundle Analysis
```bash
# Generar stats
npm run build -- --stats-json

# Instalar analyzer
npm install -g webpack-bundle-analyzer

# Analizar
webpack-bundle-analyzer dist/identity-frontend/stats.json
```

## Convenciones de Commits

```
feat: nueva funcionalidad
fix: corrección de bugs
docs: cambios en documentación
style: formateo, punto y coma faltantes, etc
refactor: refactorización de código
test: añadir tests
chore: tareas de mantenimiento
perf: mejoras de performance
```

### Ejemplos:
```bash
git commit -m "feat: add login component"
git commit -m "fix: resolve authentication token expiration"
git commit -m "docs: update README with setup instructions"
git commit -m "refactor: simplify user service logic"
```
