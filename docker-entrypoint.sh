#!/bin/sh
set -e

# Script para inyectar variables de entorno en runtime
# Esto permite configurar la app sin rebuild

# Crear archivo de configuración con variables de entorno
cat > /usr/share/nginx/html/assets/env.js << EOF
(function(window) {
  window.__env = window.__env || {};
  window.__env.apiUrl = '${API_URL:-http://localhost:45001}';
  window.__env.identityServerUrl = '${IDENTITY_SERVER_URL:-http://localhost:45001}';
  window.__env.ecommerceUrl = '${ECOMMERCE_URL:-http://localhost:4200}';
  window.__env.sentryDsn = '${SENTRY_DSN:-}';
  window.__env.production = ${PRODUCTION:-true};
})(this);
EOF

echo "Environment configuration injected:"
echo "  API_URL: ${API_URL:-http://localhost:45001}"
echo "  IDENTITY_SERVER_URL: ${IDENTITY_SERVER_URL:-http://localhost:45001}"
echo "  ECOMMERCE_URL: ${ECOMMERCE_URL:-http://localhost:4200}"

# Ejecutar comando pasado (nginx)
exec "$@"
