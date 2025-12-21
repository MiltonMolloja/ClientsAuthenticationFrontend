# ============================================
# Identity Frontend - Multi-stage Dockerfile
# Angular 20 + Nginx
# ============================================

# Stage 1: Build
FROM node:22-alpine AS build

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci --legacy-peer-deps

# Copiar código fuente
COPY . .

# Build de producción
RUN npm run build:prod

# Stage 2: Production con Nginx
FROM nginx:alpine AS production

# Instalar envsubst para variables de entorno en runtime
RUN apk add --no-cache gettext

# Copiar configuración de nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Copiar archivos compilados desde stage de build
# Angular 20 genera en dist/[project-name]/browser
COPY --from=build /app/dist/identity-frontend/browser /usr/share/nginx/html

# Crear carpeta assets si no existe
RUN mkdir -p /usr/share/nginx/html/assets

# Copiar script de inicio que reemplaza variables de entorno
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Exponer puerto
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

# Ejecutar script de inicio
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
