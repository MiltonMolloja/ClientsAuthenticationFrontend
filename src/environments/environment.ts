// Declare window.__env for TypeScript
declare global {
  interface Window {
    __env?: {
      apiUrl?: string;
      identityServerUrl?: string;
      ecommerceUrl?: string;
      sentryDsn?: string;
      production?: string | boolean;
    };
  }
}

// Helper function to get runtime config with fallback
const getEnvValue = (key: string, fallback: string): string => {
  if (typeof window !== 'undefined' && window.__env) {
    return (window.__env as Record<string, string>)[key] || fallback;
  }
  return fallback;
};

const isProduction = (): boolean => {
  if (typeof window !== 'undefined' && window.__env?.production) {
    return window.__env.production === true || window.__env.production === 'true';
  }
  return false;
};

export const environment = {
  get production() {
    return isProduction();
  },
  get apiUrl() {
    return getEnvValue('apiUrl', 'http://localhost:10000');
  },
  get identityServerUrl() {
    return getEnvValue('identityServerUrl', 'http://localhost:4400');
  },
  get ecommerceUrl() {
    return getEnvValue('ecommerceUrl', 'http://localhost:4200');
  },
  useExternalIdentityServer: true, // Set to true to use external Identity Server (port 4400)
  tokenRefreshInterval: 840000, // 14 minutes (token expires in 15)
  sessionTimeoutWarning: 300000, // 5 minutes warning
  sessionTimeout: 900000, // 15 minutes
  get enableDebugMode() {
    return !isProduction();
  },
  apiVersion: 'v1',

  // Sentry configuration
  get sentry() {
    return {
      dsn: getEnvValue('sentryDsn', ''),
      enabled: isProduction() && !!getEnvValue('sentryDsn', ''),
    };
  },
};
