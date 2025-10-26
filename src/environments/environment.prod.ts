export const environment = {
  production: true,
  apiUrl: 'https://api.yourdomain.com', // TODO: Replace with actual production API URL
  tokenRefreshInterval: 840000, // 14 minutes (token expires in 15)
  sessionTimeoutWarning: 300000, // 5 minutes warning
  sessionTimeout: 900000, // 15 minutes
  enableDebugMode: false,
  apiVersion: 'v1'
};
