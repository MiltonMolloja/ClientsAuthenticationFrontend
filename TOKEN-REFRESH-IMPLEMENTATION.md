# Implementación de Renovación Automática de Token - ClientsAuthenticationFrontend

## Resumen

Se implementó un sistema de renovación automática de tokens JWT cuando expiran, con manejo de concurrencia y logging detallado, siguiendo el mismo patrón implementado en ECommerceFrontend.

## Problema Resuelto

**Antes:**
- El `error.interceptor` intentaba renovar el token en 401
- **NO había manejo de concurrencia**: múltiples peticiones 401 → múltiples llamadas a refresh-token
- El `error.interceptor` mezclaba responsabilidades (manejo de errores + autenticación)
- No había logging detallado del proceso de refresh

**Después:**
- El `auth.interceptor` maneja 401 y renovación de tokens
- **Manejo de concurrencia**: múltiples peticiones 401 → solo 1 refresh
- Separación de responsabilidades: auth vs error handling
- Logging detallado con emojis para depuración
- Cola de peticiones mientras se renueva el token

---

## Archivos Modificados

### 1. `src/app/core/interceptors/auth.interceptor.ts`
**Cambio:** Reescritura completa (24 líneas → 200 líneas)

**Nuevas características:**
- ✅ Detección de errores 401 (token expirado)
- ✅ Renovación automática de token usando refresh token
- ✅ **Manejo de concurrencia con `BehaviorSubject`**
- ✅ Cola de peticiones mientras se renueva el token
- ✅ Logging detallado para depuración
- ✅ Exclusión de URLs de autenticación (evitar loop infinito)
- ✅ Soporte para header `Refresh-Token` en endpoints de sesiones

**URLs excluidas del interceptor:**
```typescript
const EXCLUDED_URLS = [
  '/v1/identity/authentication',        // Login
  '/v1/identity/refresh-token',         // Refresh token
  '/v1/identity/revoke-token',          // Logout
  '/v1/identity/forgot-password',       // Forgot password
  '/v1/identity/reset-password',        // Reset password
  '/v1/identity/confirm-email',         // Email confirmation
  '/v1/identity/resend-email-confirmation', // Resend confirmation
  '/v1/identity',                       // Register (POST)
];
```

### 2. `src/app/core/interceptors/error.interceptor.ts`
**Cambio:** Simplificado (90 líneas → 80 líneas)

**Cambios:**
- ❌ Removida lógica de refresh token (ahora en `auth.interceptor`)
- ✅ Manejo de errores genéricos (403, 404, 429, 500, etc.)
- ✅ Retry automático para errores de red y 5xx
- ✅ No muestra notificación para 401 (lo maneja `auth.interceptor`)

### 3. `src/app/core/services/auth.service.ts`
**Cambio:** Modificación menor en `refreshToken()`

**Cambios:**
- ✅ Verifica que hay refresh token antes de llamar al endpoint
- ✅ No limpia sesión ni navega (eso lo hace el interceptor)
- ✅ Retorna Observable que puede fallar gracefully
- ✅ Documentación mejorada

---

## Flujo de Renovación de Token

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Petición HTTP con token expirado                            │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. Servidor responde 401 (Unauthorized)                        │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. Auth Interceptor detecta 401                                │
└─────────────────────────────────────────────────────────────────┘
                            ↓
                    ┌───────┴───────┐
                    │               │
        ┌───────────▼─────┐   ┌─────▼──────────┐
        │ ¿Ya refrescando? │   │ ¿Hay refresh   │
        │      SÍ          │   │    token?      │
        └───────────┬─────┘   └─────┬──────────┘
                    │               │ NO
                    │               ↓
                    │         ┌─────────────┐
                    │         │ Logout +    │
                    │         │ Redirect    │
                    │         └─────────────┘
                    │
                    │         SÍ
                    ↓         ↓
        ┌─────────────────────────────┐
        │ Encolar petición en cola    │
        │ (refreshTokenSubject)       │
        └─────────────┬───────────────┘
                      │
                      ↓
        ┌─────────────────────────────┐
        │ Llamar a /refresh-token     │
        └─────────────┬───────────────┘
                      │
              ┌───────┴────────┐
              │                │
        ┌─────▼─────┐    ┌─────▼──────┐
        │  Éxito    │    │   Error    │
        └─────┬─────┘    └─────┬──────┘
              │                │
              ↓                ↓
    ┌──────────────────┐  ┌──────────────┐
    │ Nuevo token      │  │ Logout +     │
    │ guardado         │  │ Redirect     │
    └──────┬───────────┘  └──────────────┘
           │
           ↓
    ┌──────────────────────────┐
    │ Notificar a todas las    │
    │ peticiones encoladas     │
    └──────┬───────────────────┘
           │
           ↓
    ┌──────────────────────────┐
    │ Reintentar peticiones    │
    │ con nuevo token          │
    └──────────────────────────┘
```

---

## Manejo de Concurrencia

### Problema
Si múltiples peticiones HTTP fallan con 401 simultáneamente (ej: cargar perfil, sesiones, actividad), todas intentarían renovar el token al mismo tiempo.

### Solución
Usamos un patrón de "cola" con `BehaviorSubject`:

```typescript
// Estado compartido
let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

// Primera petición que recibe 401
if (!isRefreshing) {
  isRefreshing = true;
  // Iniciar refresh
  authService.refreshToken().subscribe(...)
}

// Peticiones subsiguientes que reciben 401
if (isRefreshing) {
  // Encolar y esperar el nuevo token
  return refreshTokenSubject.pipe(
    filter(token => token !== null),
    take(1),
    switchMap(token => retry(request, token))
  );
}
```

**Resultado:**
- Solo 1 llamada a `/refresh-token` aunque haya 10 peticiones con 401
- Todas las peticiones esperan el nuevo token
- Todas se reintentan automáticamente con el nuevo token

---

## Logging Implementado

### Niveles de Log

| Emoji | Nivel | Descripción |
|-------|-------|-------------|
| 🔑 | DEBUG | Token agregado a la petición |
| ⏭️ | DEBUG | URL excluida del interceptor |
| ⚠️ | WARN | Token expirado detectado (401) |
| ⏳ | DEBUG | Petición encolada (refresh en progreso) |
| 🔄 | INFO | Iniciando renovación de token |
| ✅ | INFO | Token renovado exitosamente |
| ❌ | ERROR | Error al renovar token |
| 🏁 | DEBUG | Proceso de refresh finalizado |

### Ejemplo de Logs en Consola

```
🔑 Token agregado a la petición { url: 'http://localhost:10000/v1/identity/me', method: 'GET' }
⚠️ Token expirado (401), intentando renovar... { url: 'http://localhost:10000/v1/identity/me' }
🔄 Iniciando renovación de token...
⏳ Refresh en progreso, encolando petición { url: 'http://localhost:10000/v1/identity/sessions' }
✅ Token renovado exitosamente
✅ Token renovado, reintentando petición encolada { url: 'http://localhost:10000/v1/identity/sessions' }
🏁 Proceso de refresh finalizado
```

---

## Diferencias con ECommerceFrontend

| Característica | ECommerceFrontend | ClientsAuthenticationFrontend |
|----------------|-------------------|-------------------------------|
| Redirección al login | Login externo con returnUrl | Login local `/login` |
| URLs excluidas | 3 URLs | 8 URLs (más endpoints públicos) |
| Header adicional | No | `Refresh-Token` para `/sessions` |
| Manejo de concurrencia | ✅ Sí | ✅ Sí |
| Logging detallado | ✅ Sí | ✅ Sí |

---

## Casos de Prueba

| Escenario | Comportamiento Esperado | Estado |
|-----------|------------------------|--------|
| Token válido | Petición normal con token | ✅ |
| Token expirado, refresh OK | Renovar + reintentar | ✅ |
| Token expirado, múltiples peticiones | 1 refresh, todas reintentan | ✅ |
| Token expirado, refresh falla | Logout + redirect a `/login` | ✅ |
| Sin refresh token | Logout + redirect a `/login` | ✅ |
| URL de login/register/forgot-password | No interceptar | ✅ |
| Endpoint `/sessions` | Agregar header `Refresh-Token` | ✅ |

---

## Configuración

### Orden de Interceptores

```typescript
// app.config.ts
provideHttpClient(
  withInterceptors([
    authInterceptor,    // 1. Maneja autenticación y refresh
    errorInterceptor    // 2. Maneja otros errores
  ])
)
```

**Importante:** El `authInterceptor` debe estar **antes** del `errorInterceptor` para que maneje los 401 primero.

---

## Mejoras Futuras (Opcionales)

1. **Refresh preventivo**: Renovar el token antes de que expire (ej: 5 minutos antes)
2. **Retry con backoff**: Si el refresh falla por error de red, reintentar con exponential backoff
3. **Notificación al usuario**: Mostrar un toast "Renovando sesión..." durante el refresh
4. **Métricas**: Trackear cuántas veces se renueva el token (analytics)

---

## Troubleshooting

### El token no se renueva

**Verificar:**
1. ¿Hay refresh token en localStorage? → `localStorage.getItem('refresh_token')`
2. ¿El endpoint de refresh funciona? → Probar manualmente en Postman
3. ¿Los logs muestran el intento de refresh? → Buscar "🔄 Iniciando renovación"

### Loop infinito de refresh

**Causa probable:** El endpoint de refresh no está excluido

**Solución:** Verificar que `/v1/identity/refresh-token` esté en `EXCLUDED_URLS`

### Múltiples llamadas a refresh-token

**Causa probable:** El manejo de concurrencia no funciona

**Solución:** Verificar que `isRefreshing` y `refreshTokenSubject` sean variables globales (fuera del interceptor)

---

## Autor

Implementado el 25 de diciembre de 2024

## Referencias

- [Angular HTTP Interceptors](https://angular.dev/guide/http/interceptors)
- [RxJS BehaviorSubject](https://rxjs.dev/api/index/class/BehaviorSubject)
- [JWT Refresh Token Best Practices](https://auth0.com/blog/refresh-tokens-what-are-they-and-when-to-use-them/)
