export const environment = {
  production: false,
  apiUrl: 'http://localhost:10000',
  identityServerUrl: 'https://localhost:4400',
  useExternalIdentityServer: true, // Set to true to use external Identity Server (port 4400)
  tokenRefreshInterval: 840000, // 14 minutes (token expires in 15)
  sessionTimeoutWarning: 300000, // 5 minutes warning
  sessionTimeout: 900000, // 15 minutes
  enableDebugMode: true,
  apiVersion: 'v1',

  // Sentry configuration - disabled in development
  sentry: {
    dsn: '',
    enabled: false,
  },
};
