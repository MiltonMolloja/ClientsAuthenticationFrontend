#!/bin/sh
set -e

# Script para inyectar variables de entorno en runtime
# Esto permite configurar la app sin rebuild

# Crear archivo de configuración con variables de entorno
cat > /usr/share/nginx/html/assets/env.js << EOF
(function(window) {
  window.__env = window.__env || {};
  window.__env.apiUrl = '${API_URL:-http://localhost:10000}';
  window.__env.identityServerUrl = '${IDENTITY_SERVER_URL:-http://localhost:10000}';
  window.__env.ecommerceUrl = '${ECOMMERCE_URL:-http://localhost:4200}';
  window.__env.sentryDsn = '${SENTRY_DSN:-}';
  window.__env.production = ${PRODUCTION:-true};
})(this);
EOF

# Inyectar script en index.html (ANTES de los otros scripts)
# Detectar baseHref desde index.html para usar ruta correcta
BASE_HREF=$(grep -o 'base href="[^"]*"' /usr/share/nginx/html/index.html | sed 's/base href="//;s/"$//' || echo "/")
ENV_SCRIPT_PATH="${BASE_HREF}assets/env.js"

if ! grep -q "env.js" /usr/share/nginx/html/index.html; then
  sed -i "s|<head>|<head>\n  <script src=\"${ENV_SCRIPT_PATH}\"></script>|" /usr/share/nginx/html/index.html
  echo "✅ env.js script injected into index.html with path: ${ENV_SCRIPT_PATH}"
else
  echo "ℹ️ env.js script already present in index.html"
fi

echo "Environment configuration injected:"
echo "  API_URL: ${API_URL:-http://localhost:10000}"
echo "  IDENTITY_SERVER_URL: ${IDENTITY_SERVER_URL:-http://localhost:10000}"
echo "  ECOMMERCE_URL: ${ECOMMERCE_URL:-http://localhost:4200}"

# Ejecutar comando pasado (nginx)
exec "$@"
