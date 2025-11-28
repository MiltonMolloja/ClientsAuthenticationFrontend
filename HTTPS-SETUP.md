# Configuración HTTPS para Desarrollo Local - Identity Frontend

Este documento explica cómo ejecutar el frontend de Identity (ClientsAuthenticationFrontend) con HTTPS habilitado.

## ¿Por qué HTTPS?

HTTPS es necesario para:
- Cumplir con requisitos de seguridad modernos
- Probar funcionalidades que requieren contexto seguro (geolocalización, notificaciones push, etc.)
- Integraciones con servicios externos que requieren SSL/TLS
- Mantener consistencia con el entorno de producción

## Configuración Actual

El proyecto ya está configurado para usar HTTPS automáticamente. Angular CLI generará certificados autofirmados en el primer inicio.

### Archivo `angular.json`

La configuración SSL ya está habilitada:

```json
"serve": {
  "builder": "@angular/build:dev-server",
  "options": {
    "port": 4400,
    "ssl": true
  }
}
```

## Cómo Ejecutar con HTTPS

### Método 1: Usando npm start (Recomendado)

```bash
cd C:\Source\ClientsAuthenticationFrontend
npm start
```

El servidor se iniciará en: **https://localhost:4400**

### Método 2: Usando ng serve directamente

```bash
cd C:\Source\ClientsAuthenticationFrontend
ng serve
```

### Método 3: Con puerto personalizado

```bash
ng serve --ssl --port 4500
```

## Advertencia de Certificado

La primera vez que accedas a `https://localhost:4400`, el navegador mostrará una advertencia de seguridad porque el certificado es autofirmado.

### Chrome/Edge:
1. Haz clic en "Avanzado"
2. Haz clic en "Continuar a localhost (no seguro)"

### Firefox:
1. Haz clic en "Avanzado"
2. Haz clic en "Aceptar el riesgo y continuar"

## Verificar que HTTPS está funcionando

1. Abre la consola del navegador (F12)
2. Ve a la pestaña "Network" o "Red"
3. Verifica que las URLs comiencen con `https://localhost:4400`
4. El icono del candado debe aparecer en la barra de direcciones (aunque con advertencia de certificado autofirmado)

## Integración con Identity Service

Este frontend se comunica con el servicio Identity que corre en:
- **HTTP**: `http://localhost:4400` (Identity.Api)
- **Frontend HTTPS**: `https://localhost:4400`

Asegúrate de que las URLs en los archivos de configuración sean correctas.

## Troubleshooting

### Error: "Cannot find module '@angular/build'"

```bash
npm install
```

### Puerto 4400 ya en uso

```bash
# Detener el proceso en el puerto 4400
netstat -ano | findstr :4400
taskkill /PID [PID] /F

# O usar otro puerto
ng serve --ssl --port 4500
```

### Certificado no confiable

El certificado autofirmado es normal para desarrollo local. Los navegadores modernos permiten continuar después de la advertencia.

### Error de CORS

Si experimentas errores de CORS al conectar con el backend, asegúrate de que el servicio Identity.Api tenga configurado CORS correctamente para aceptar requests desde `https://localhost:4400`.

## Funcionalidades de Identity Frontend

Este frontend maneja:
- 🔐 Autenticación de usuarios (Login/Logout)
- 👤 Registro de nuevas cuentas
- 🔑 Gestión de contraseñas (Cambio, recuperación)
- 📧 Verificación de email
- 🔒 Autenticación de dos factores (2FA)
- 👥 Gestión de perfiles de usuario
- 🎫 Gestión de sesiones y tokens

## Archivos Relacionados

- `angular.json` - Configuración SSL del servidor de desarrollo
- `src/environments/environment.ts` - Configuración de URLs de servicios
- `src/app/core/services/` - Servicios de autenticación e identidad

## Referencias

- [Angular HTTPS Configuration](https://angular.dev/tools/cli/serve)
- [Identity Service Documentation](../src/Services/Identity/README.md) (si existe)
