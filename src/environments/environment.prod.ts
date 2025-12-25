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

export const environment = {
  production: true,
  get apiUrl() {
    return getEnvValue('apiUrl', 'http://localhost:10000');
  },
  get identityServerUrl() {
    return getEnvValue('identityServerUrl', 'http://localhost:4400');
  },
  get ecommerceUrl() {
    return getEnvValue('ecommerceUrl', 'https://localhost:4200');
  },
  useExternalIdentityServer: true,
  tokenRefreshInterval: 840000, // 14 minutes (token expires in 15)
  sessionTimeoutWarning: 300000, // 5 minutes warning
  sessionTimeout: 900000, // 15 minutes
  enableDebugMode: false,
  apiVersion: 'v1',

  // Sentry configuration for production
  get sentry() {
    return {
      dsn: getEnvValue('sentryDsn', ''),
      enabled: !!getEnvValue('sentryDsn', ''),
    };
  },
};
