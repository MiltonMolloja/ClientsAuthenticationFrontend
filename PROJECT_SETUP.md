# Identity Frontend - Proyecto Base (Parte 1)

## Resumen del Proyecto

Proyecto Angular v20 con Angular Material para un sistema de autenticación de microservicios.

### Versiones Instaladas

- **Angular**: 20.3.7
- **Angular CLI**: 20.3.7
- **Angular Material**: 20.2.10
- **Angular CDK**: 20.2.10
- **TypeScript**: 5.9.3
- **RxJS**: 7.8.2
- **Node**: 22.20.0
- **npm**: 10.9.3

### Dependencias Principales

#### Producción
- `@angular/animations`: ^20.3.7
- `@angular/cdk`: ^20.2.10
- `@angular/material`: ^20.2.10
- `qrcode`: ^1.5.4 (para 2FA)
- `@types/qrcode`: ^1.5.6
- `rxjs`: ~7.8.0

#### Desarrollo
- `eslint`: ^9.38.0
- `@angular-eslint/*`: ^20.4.0
- `@typescript-eslint/*`: ^8.46.2
- `prettier`: Configurado en package.json

## Estructura de Carpetas

```
src/
├── app/
│   ├── core/                           # Servicios core, guards, interceptors, models
│   │   ├── guards/
│   │   │   └── auth.guard.ts          # Guard de autenticación (placeholder)
│   │   ├── interceptors/
│   │   │   ├── auth.interceptor.ts    # Interceptor JWT (placeholder)
│   │   │   └── error.interceptor.ts   # Interceptor de errores (placeholder)
│   │   ├── services/
│   │   │   └── auth.service.ts        # Servicio de autenticación (placeholder)
│   │   └── models/
│   │       ├── user.model.ts          # Modelos de usuario
│   │       ├── auth.model.ts          # Modelos de autenticación
│   │       └── index.ts               # Barrel export
│   ├── features/                       # Módulos de features (lazy loaded)
│   │   ├── auth/
│   │   │   └── auth.routes.ts         # Rutas de autenticación
│   │   ├── profile/
│   │   │   └── profile.routes.ts      # Rutas de perfil
│   │   ├── two-factor/
│   │   │   └── two-factor.routes.ts   # Rutas de 2FA
│   │   └── admin/
│   │       └── admin.routes.ts        # Rutas de administración
│   ├── shared/                         # Componentes compartidos (vacío - Part 2)
│   │   ├── components/
│   │   ├── directives/
│   │   └── pipes/
│   ├── layout/                         # Layout components (vacío - Part 2)
│   │   ├── header/
│   │   ├── footer/
│   │   └── sidebar/
│   ├── app.ts                          # Componente principal
│   ├── app.html                        # Template principal
│   ├── app.scss                        # Estilos del componente
│   ├── app.config.ts                   # Configuración de la aplicación
│   └── app.routes.ts                   # Configuración de rutas
├── assets/                             # Recursos estáticos
├── environments/                       # Archivos de entorno
│   ├── environment.ts                  # Desarrollo
│   └── environment.prod.ts             # Producción
└── styles/                             # Estilos globales
    ├── _variables.scss                 # Variables SCSS
    ├── _mixins.scss                    # Mixins SCSS
    └── styles.scss                     # Estilos globales principales
```

## Configuración Realizada

### 1. Angular Material

- **Tema**: Material 3 con paletas Azure y Blue
- **Dark Mode**: Configurado con `prefers-color-scheme`
- **Animaciones**: Habilitadas
- **Tipografía**: Roboto

### 2. App Config (app.config.ts)

```typescript
- provideZoneChangeDetection({ eventCoalescing: true })
- provideRouter con:
  - PreloadAllModules (preloading strategy)
  - withComponentInputBinding()
  - withViewTransitions()
- provideHttpClient con:
  - Interceptores funcionales (placeholder)
  - XSRF protection configurado
- provideAnimations()
```

### 3. Rutas (app.routes.ts)

Estructura de lazy loading configurada:
- `/` → Redirige a `/profile`
- `/auth` → Módulo de autenticación (sin guards)
- `/profile` → Módulo de perfil (con guards - Part 2)
- `/2fa` → Módulo de 2FA (con guards - Part 2)
- `/admin` → Módulo de administración (con guards - Part 2)
- `/**` → Redirige a `/profile`

### 4. Environments

**Development** (`environment.ts`):
```typescript
apiUrl: 'http://localhost:10000'
tokenRefreshInterval: 840000 (14 minutos)
sessionTimeout: 900000 (15 minutos)
enableDebugMode: true
```

**Production** (`environment.prod.ts`):
```typescript
apiUrl: 'https://api.yourdomain.com' // TODO: Actualizar
enableDebugMode: false
```

### 5. TSConfig

**Path Mappings configurados**:
- `@core/*` → `src/app/core/*`
- `@shared/*` → `src/app/shared/*`
- `@features/*` → `src/app/features/*`
- `@layout/*` → `src/app/layout/*`
- `@environments/*` → `src/environments/*`

**Opciones estrictas habilitadas**:
- strict: true
- strictTemplates: true
- noImplicitReturns: true
- noFallthroughCasesInSwitch: true

### 6. ESLint

Configuración con:
- Reglas recomendadas de Angular
- Reglas de TypeScript
- Reglas de accesibilidad para templates
- Prefijos personalizados (`app`)

### 7. Prettier

Configuración:
- printWidth: 100
- singleQuote: true
- Angular parser para HTML

### 8. Estilos Globales

**Variables SCSS** (`_variables.scss`):
- Colores (primary, accent, warn, success, info)
- Spacing (xs, sm, md, lg, xl, xxl)
- Border radius
- Tipografía
- Breakpoints responsivos
- Z-index layers
- Shadows
- Transitions

**Mixins SCSS** (`_mixins.scss`):
- Responsive breakpoints
- Flexbox utilities
- Card styles
- Truncate text
- Custom scrollbar
- Focus styles
- Button reset
- Elevation helper

**Utilidades CSS**:
- Container
- Flex utilities
- Text alignment
- Spacing utilities (margin/padding)
- Card utility
- Loading overlay
- Page layout
- Responsive utilities

## Scripts NPM Disponibles

```bash
npm start              # Servidor de desarrollo
npm run build          # Build de producción
npm run watch          # Build en modo watch
npm test              # Tests con Karma
npm run lint          # Linter ESLint
npm run lint:fix      # Fix automático de ESLint
npm run format        # Formatear con Prettier
npm run format:check  # Verificar formato
```

## Comandos para Iniciar el Proyecto

### Desarrollo
```bash
cd C:\Source\ClientsAuthenticationFrontend\identity-frontend
npm start
# O con puerto específico:
npm start -- --port 4200
```

El servidor estará disponible en `http://localhost:4200`

### Build de Producción
```bash
npm run build
```

Los archivos compilados estarán en `dist/identity-frontend/`

## Estado del Build

✅ **BUILD EXITOSO**

```
Initial chunk files:
- main-NKM4CLP4.js     | 272.56 kB | 72.61 kB (gzip)
- polyfills-5CFQRCPP.js| 34.59 kB  | 11.33 kB (gzip)
- styles-OGA7BB6H.css  | 16.48 kB  | 2.01 kB (gzip)

Lazy chunk files:
- two-factor-routes    | 90 bytes
- profile-routes       | 87 bytes
- admin-routes         | 85 bytes
- auth-routes          | 84 bytes

Total: 324.24 kB | 86.58 kB (gzip)
```

## Características Implementadas

### Arquitectura
✅ Standalone components (sin NgModules)
✅ Functional guards e interceptors
✅ Lazy loading de features
✅ Path mappings para imports limpios
✅ Estructura modular escalable

### Estilos
✅ Material 3 theming
✅ Dark mode automático (prefers-color-scheme)
✅ Variables y mixins SCSS reutilizables
✅ Utilidades CSS responsivas
✅ Tema personalizado indigo-pink

### Configuración
✅ TypeScript strict mode
✅ ESLint + Prettier
✅ Environment variables
✅ XSRF protection
✅ Preloading strategy

## Próximos Pasos (Parte 2)

La Parte 2 incluirá la implementación de:

1. **Componentes de Autenticación**:
   - Login
   - Register
   - Forgot Password
   - Reset Password

2. **Componentes de Perfil**:
   - View Profile
   - Edit Profile

3. **Two-Factor Authentication**:
   - Setup 2FA
   - Verify 2FA
   - Backup Codes
   - Disable 2FA

4. **Admin Panel**:
   - User Management
   - System Settings
   - Audit Logs

5. **Layout Components**:
   - Header con navegación
   - Footer
   - Sidebar (opcional)

6. **Servicios Completos**:
   - AuthService implementado
   - UserService
   - TwoFactorService
   - TokenService

7. **Guards e Interceptors**:
   - Auth Guard completo
   - Role Guard
   - Auth Interceptor (JWT)
   - Error Interceptor completo
   - Loading Interceptor

8. **Shared Components**:
   - Loading Spinner
   - Error Messages
   - Confirmation Dialog
   - Snackbar Service

## Notas Importantes

- Todos los archivos placeholder están marcados con comentarios indicando que serán implementados en la Parte 2
- Los guards están configurados pero no bloquean rutas (retornan `true`) hasta la Parte 2
- Los interceptors están registrados pero vacíos hasta la Parte 2
- El proyecto usa Signals de Angular donde es apropiado
- Se sigue la guía de estilo oficial de Angular
- Cumple con WCAG 2.1 AA en templates de accesibilidad

## Soporte

Para cualquier duda sobre la estructura del proyecto, revisar:
- [Angular Documentation](https://angular.dev)
- [Angular Material Documentation](https://material.angular.dev)
- [TypeScript Documentation](https://www.typescriptlang.org)
