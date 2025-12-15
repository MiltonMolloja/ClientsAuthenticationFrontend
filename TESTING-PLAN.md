# 🧪 Testing Plan - ClientsAuthenticationFrontend

Plan completo de testing para alcanzar cobertura >80% antes de producción.

---

## 📊 Estado Actual

### Coverage Actual
```
❌ Coverage: ~5% (solo app.spec.ts)
❌ Unit Tests: 1
❌ Integration Tests: 0
❌ E2E Tests: 0
```

### Objetivo
```
✅ Coverage: >80%
✅ Unit Tests: ~50+
✅ Integration Tests: ~15+
✅ E2E Tests: ~10+
```

---

## 🎯 Estrategia de Testing

### 1. Unit Tests (Jasmine + Karma)
**Objetivo**: Probar componentes, servicios, guards, interceptors de forma aislada

### 2. Integration Tests (Jasmine + Karma)
**Objetivo**: Probar interacción entre componentes y servicios

### 3. E2E Tests (Playwright/Cypress)
**Objetivo**: Probar flujos completos de usuario

---

## 📝 Tests Prioritarios

### 🔴 Alta Prioridad (Críticos para Producción)

#### Core Services

##### 1. AuthService (`auth.service.spec.ts`)
```typescript
describe('AuthService', () => {
  // ✅ Login exitoso
  // ✅ Login con credenciales inválidas
  // ✅ Login con 2FA requerido
  // ✅ Logout
  // ✅ Refresh token exitoso
  // ✅ Refresh token expirado
  // ✅ Register exitoso
  // ✅ Register con email duplicado
  // ✅ Forgot password
  // ✅ Reset password
  // ✅ Confirm email
  // ✅ Enable 2FA
  // ✅ Disable 2FA
  // ✅ Verify 2FA code
  // ✅ Get backup codes
  // ✅ Regenerate backup codes
  // ✅ Get sessions
  // ✅ Revoke session
  // ✅ Revoke all sessions
  // ✅ Update user profile
  // ✅ Get activity log
  // ✅ Storage event listener (logout sync)
});
```

##### 2. TokenService (`token.service.spec.ts`)
```typescript
describe('TokenService', () => {
  // ✅ Set tokens
  // ✅ Get access token
  // ✅ Get refresh token
  // ✅ Clear tokens
  // ✅ Decode token válido
  // ✅ Decode token inválido
  // ✅ Check token expired
  // ✅ Check token not expired
  // ✅ Get token expiration date
  // ✅ SSR safety (isBrowser check)
  // ✅ localStorage error handling
});
```

##### 3. LoggerService (`logger.service.spec.ts`)
```typescript
describe('LoggerService', () => {
  // ✅ Debug log en dev mode
  // ✅ Debug log NO en production
  // ✅ Info log en dev mode
  // ✅ Info log NO en production
  // ✅ Warn log en dev y production
  // ✅ Error log en dev y production
  // ✅ Error log envía a external logger en production
  // ✅ Group/groupEnd
  // ✅ Table
});
```

##### 4. LoadingService (`loading.service.spec.ts`)
```typescript
describe('LoadingService', () => {
  // ✅ Show loading
  // ✅ Hide loading
  // ✅ Multiple show calls (counter)
  // ✅ Force hide
  // ✅ Loading signal reactivity
});
```

##### 5. ThemeService (`theme.service.spec.ts`)
```typescript
describe('ThemeService', () => {
  // ✅ Initialize with system theme
  // ✅ Initialize with saved theme
  // ✅ Set light theme
  // ✅ Set dark theme
  // ✅ Set auto theme
  // ✅ Toggle theme
  // ✅ Persist theme to localStorage
  // ✅ Apply theme to document
});
```

##### 6. LanguageService (`language.service.spec.ts`)
```typescript
describe('LanguageService', () => {
  // ✅ Initialize with default language
  // ✅ Initialize with saved language
  // ✅ Set language
  // ✅ Get translation
  // ✅ Get translation with fallback
  // ✅ Language changed signal
  // ✅ Persist language to localStorage
});
```

#### Core Interceptors

##### 7. AuthInterceptor (`auth.interceptor.spec.ts`)
```typescript
describe('authInterceptor', () => {
  // ✅ Add Authorization header
  // ✅ Add Refresh-Token header for sessions
  // ✅ Skip Authorization for /authentication
  // ✅ Skip Authorization for /refresh-token
  // ✅ Handle request without token
});
```

##### 8. ErrorInterceptor (`error.interceptor.spec.ts`)
```typescript
describe('errorInterceptor', () => {
  // ✅ Handle 401 - refresh token
  // ✅ Handle 401 - refresh failed, logout
  // ✅ Handle 403 - forbidden
  // ✅ Handle 404 - not found
  // ✅ Handle 429 - rate limit
  // ✅ Handle 500 - server error
  // ✅ Handle network error (status 0)
  // ✅ Retry logic for 5xx errors
  // ✅ Retry logic for network errors
  // ✅ No retry for 4xx errors
  // ✅ Exponential backoff
  // ✅ Show notification on error
  // ✅ Log error
});
```

#### Core Guards

##### 9. AuthGuard (`auth.guard.spec.ts`)
```typescript
describe('authGuard', () => {
  // ✅ Allow access with valid token
  // ✅ Deny access without token
  // ✅ Deny access with expired token
  // ✅ Redirect to login with returnUrl
});
```

##### 10. NoAuthGuard (`no-auth.guard.spec.ts`)
```typescript
describe('noAuthGuard', () => {
  // ✅ Allow access without token
  // ✅ Redirect to home with valid token
});
```

##### 11. EmailVerifiedGuard (`email-verified.guard.spec.ts`)
```typescript
describe('emailVerifiedGuard', () => {
  // ✅ Allow access with verified email
  // ✅ Deny access without verified email
  // ✅ Redirect to confirm-email page
});
```

---

### 🟡 Media Prioridad (Componentes Principales)

#### Auth Pages

##### 12. LoginComponent (`login.spec.ts`)
```typescript
describe('LoginComponent', () => {
  // ✅ Render form
  // ✅ Form validation (email, password required)
  // ✅ Submit valid form
  // ✅ Submit invalid form
  // ✅ Login success - redirect to home
  // ✅ Login success - redirect to returnUrl
  // ✅ Login requires 2FA - redirect to 2FA page
  // ✅ Login error - show error message
  // ✅ Remember me checkbox
  // ✅ External login buttons (Google, Microsoft)
  // ✅ Navigate to register
  // ✅ Navigate to forgot password
});
```

##### 13. RegisterComponent (`register.spec.ts`)
```typescript
describe('RegisterComponent', () => {
  // ✅ Render form
  // ✅ Form validation (all fields required)
  // ✅ Password strength validation
  // ✅ Password confirmation match
  // ✅ Email format validation
  // ✅ Submit valid form
  // ✅ Submit invalid form
  // ✅ Register success - show success message
  // ✅ Register error - show error message
  // ✅ Navigate to login
});
```

##### 14. TwoFactorAuthComponent (`two-factor-auth.spec.ts`)
```typescript
describe('TwoFactorAuthComponent', () => {
  // ✅ Render authenticator code input
  // ✅ Render backup code input
  // ✅ Toggle between authenticator and backup code
  // ✅ Submit valid code
  // ✅ Submit invalid code
  // ✅ Show attempts warning
  // ✅ Handle account lockout
  // ✅ Resend code
});
```

##### 15. ForgotPasswordComponent (`forgot-password.spec.ts`)
```typescript
describe('ForgotPasswordComponent', () => {
  // ✅ Render form
  // ✅ Email validation
  // ✅ Submit valid email
  // ✅ Submit invalid email
  // ✅ Success - show success message
  // ✅ Error - show error message
  // ✅ Navigate back to login
});
```

##### 16. ResetPasswordComponent (`reset-password.spec.ts`)
```typescript
describe('ResetPasswordComponent', () => {
  // ✅ Render form
  // ✅ Password validation
  // ✅ Password confirmation match
  // ✅ Submit valid form
  // ✅ Submit invalid form
  // ✅ Success - redirect to login
  // ✅ Error - show error message
  // ✅ Invalid token - show error
});
```

##### 17. ConfirmEmailComponent (`confirm-email.spec.ts`)
```typescript
describe('ConfirmEmailComponent', () => {
  // ✅ Auto-confirm on load with valid token
  // ✅ Show error with invalid token
  // ✅ Resend confirmation email
  // ✅ Navigate to login after success
});
```

#### Profile Pages

##### 18. ProfileComponent (`profile.spec.ts`)
```typescript
describe('ProfileComponent', () => {
  // ✅ Load user data
  // ✅ Display user info
  // ✅ Navigate to edit profile
  // ✅ Navigate to change password
  // ✅ Navigate to security settings
  // ✅ Navigate to active sessions
});
```

##### 19. EditProfileComponent (`edit-profile.spec.ts`)
```typescript
describe('EditProfileComponent', () => {
  // ✅ Load current user data
  // ✅ Form validation
  // ✅ Submit valid form
  // ✅ Submit invalid form
  // ✅ Success - update local state
  // ✅ Error - show error message
  // ✅ Cancel - navigate back
});
```

##### 20. ChangePasswordComponent (`change-password.spec.ts`)
```typescript
describe('ChangePasswordComponent', () => {
  // ✅ Form validation
  // ✅ Current password required
  // ✅ New password strength validation
  // ✅ Password confirmation match
  // ✅ Submit valid form
  // ✅ Submit invalid form
  // ✅ Success - logout and redirect
  // ✅ Error - show error message
});
```

##### 21. SecuritySettingsComponent (`security-settings.spec.ts`)
```typescript
describe('SecuritySettingsComponent', () => {
  // ✅ Display 2FA status
  // ✅ Enable 2FA button
  // ✅ Disable 2FA button
  // ✅ Regenerate backup codes button
  // ✅ View backup codes
  // ✅ Navigate to setup 2FA
  // ✅ Navigate to disable 2FA
});
```

##### 22. ActiveSessionsComponent (`active-sessions.spec.ts`)
```typescript
describe('ActiveSessionsComponent', () => {
  // ✅ Load sessions
  // ✅ Display sessions list
  // ✅ Identify current session
  // ✅ Revoke single session
  // ✅ Revoke all sessions
  // ✅ Confirm revoke dialog
  // ✅ Success - refresh list
  // ✅ Error - show error message
});
```

#### 2FA Pages

##### 23. Setup2FAComponent (`setup-2fa.spec.ts`)
```typescript
describe('Setup2FAComponent', () => {
  // ✅ Load 2FA setup data
  // ✅ Generate QR code
  // ✅ Display secret key
  // ✅ Copy secret key
  // ✅ Verify code
  // ✅ Display backup codes
  // ✅ Copy backup codes
  // ✅ Download backup codes
  // ✅ Complete setup
  // ✅ Step navigation
});
```

##### 24. Disable2FAComponent (`disable-2fa.spec.ts`)
```typescript
describe('Disable2FAComponent', () => {
  // ✅ Render form
  // ✅ Password validation
  // ✅ Submit valid password
  // ✅ Submit invalid password
  // ✅ Success - redirect to security settings
  // ✅ Error - show error message
});
```

##### 25. Regenerate2FAComponent (`regenerate-2fa.spec.ts`)
```typescript
describe('Regenerate2FAComponent', () => {
  // ✅ Show confirmation dialog
  // ✅ Regenerate codes
  // ✅ Display new codes
  // ✅ Copy codes
  // ✅ Download codes
  // ✅ Success message
  // ✅ Error - show error message
});
```

---

### 🟢 Baja Prioridad (Componentes Shared)

##### 26. LoadingSpinnerComponent (`loading-spinner.spec.ts`)
```typescript
describe('LoadingSpinnerComponent', () => {
  // ✅ Show when loading is true
  // ✅ Hide when loading is false
  // ✅ Display loading text
});
```

##### 27. ErrorBoundaryComponent (`error-boundary.spec.ts`)
```typescript
describe('ErrorBoundaryComponent', () => {
  // ✅ Display error message
  // ✅ Reload button works
  // ✅ Go home button works
});
```

##### 28. AuthLayoutComponent (`auth-layout.spec.ts`)
```typescript
describe('AuthLayoutComponent', () => {
  // ✅ Render logo
  // ✅ Render language toggle
  // ✅ Render theme toggle
  // ✅ Render footer
  // ✅ Project content
});
```

##### 29. DashboardLayoutComponent (`dashboard-layout.spec.ts`)
```typescript
describe('DashboardLayoutComponent', () => {
  // ✅ Render header
  // ✅ Render sidebar
  // ✅ Render user menu
  // ✅ Logout button
  // ✅ Navigation links
  // ✅ Project content
});
```

##### 30. LanguageToggleComponent (`language-toggle.spec.ts`)
```typescript
describe('LanguageToggleComponent', () => {
  // ✅ Display current language
  // ✅ Toggle language
  // ✅ Update UI on language change
});
```

##### 31. ThemeToggleComponent (`theme-toggle.spec.ts`)
```typescript
describe('ThemeToggleComponent', () => {
  // ✅ Display current theme
  // ✅ Toggle theme
  // ✅ Update UI on theme change
});
```

---

## 🔄 Integration Tests

### 1. Login Flow
```typescript
describe('Login Integration', () => {
  // ✅ Login → Home redirect
  // ✅ Login → ReturnUrl redirect
  // ✅ Login → 2FA → Home
  // ✅ Login error → Stay on login
});
```

### 2. Registration Flow
```typescript
describe('Registration Integration', () => {
  // ✅ Register → Confirm email page
  // ✅ Confirm email → Login
});
```

### 3. Password Reset Flow
```typescript
describe('Password Reset Integration', () => {
  // ✅ Forgot password → Email sent
  // ✅ Reset password → Login
});
```

### 4. 2FA Setup Flow
```typescript
describe('2FA Setup Integration', () => {
  // ✅ Enable 2FA → Setup → Verify → Complete
  // ✅ Disable 2FA → Confirm → Success
  // ✅ Regenerate codes → Display → Save
});
```

### 5. Profile Management Flow
```typescript
describe('Profile Management Integration', () => {
  // ✅ Edit profile → Save → Update UI
  // ✅ Change password → Logout → Login
});
```

### 6. Session Management Flow
```typescript
describe('Session Management Integration', () => {
  // ✅ View sessions → Revoke → Refresh list
  // ✅ Revoke all → Logout
});
```

### 7. Token Refresh Flow
```typescript
describe('Token Refresh Integration', () => {
  // ✅ Token expires → Auto refresh → Continue
  // ✅ Refresh fails → Logout → Login
});
```

### 8. Error Handling Flow
```typescript
describe('Error Handling Integration', () => {
  // ✅ Network error → Retry → Success
  // ✅ Network error → Retry → Fail → Show error
  // ✅ 401 → Refresh → Retry request
  // ✅ 403 → Show error
  // ✅ 500 → Retry → Success
});
```

---

## 🎭 E2E Tests (Playwright/Cypress)

### Critical User Journeys

#### 1. Complete Registration Journey
```typescript
test('User can register and confirm email', async () => {
  // 1. Navigate to register
  // 2. Fill form
  // 3. Submit
  // 4. Verify success message
  // 5. Navigate to confirm email (mock email link)
  // 6. Verify email confirmed
  // 7. Navigate to login
  // 8. Login with new credentials
  // 9. Verify dashboard
});
```

#### 2. Complete Login Journey
```typescript
test('User can login and access dashboard', async () => {
  // 1. Navigate to login
  // 2. Fill credentials
  // 3. Submit
  // 4. Verify redirect to dashboard
  // 5. Verify user info displayed
});
```

#### 3. Complete 2FA Journey
```typescript
test('User can enable and use 2FA', async () => {
  // 1. Login
  // 2. Navigate to security settings
  // 3. Click enable 2FA
  // 4. Scan QR code (mock)
  // 5. Enter verification code
  // 6. Save backup codes
  // 7. Complete setup
  // 8. Logout
  // 9. Login again
  // 10. Enter 2FA code
  // 11. Verify dashboard access
});
```

#### 4. Password Reset Journey
```typescript
test('User can reset password', async () => {
  // 1. Navigate to forgot password
  // 2. Enter email
  // 3. Submit
  // 4. Verify success message
  // 5. Navigate to reset password (mock email link)
  // 6. Enter new password
  // 7. Submit
  // 8. Verify redirect to login
  // 9. Login with new password
  // 10. Verify dashboard access
});
```

#### 5. Profile Update Journey
```typescript
test('User can update profile', async () => {
  // 1. Login
  // 2. Navigate to edit profile
  // 3. Update first name and last name
  // 4. Submit
  // 5. Verify success message
  // 6. Verify updated info in header
});
```

#### 6. Session Management Journey
```typescript
test('User can manage sessions', async () => {
  // 1. Login on browser 1
  // 2. Login on browser 2 (simulate)
  // 3. Navigate to active sessions
  // 4. Verify 2 sessions listed
  // 5. Revoke session 2
  // 6. Verify only 1 session
});
```

#### 7. Theme Toggle Journey
```typescript
test('User can toggle theme', async () => {
  // 1. Navigate to app
  // 2. Verify light theme
  // 3. Click theme toggle
  // 4. Verify dark theme applied
  // 5. Refresh page
  // 6. Verify dark theme persisted
});
```

#### 8. Language Toggle Journey
```typescript
test('User can toggle language', async () => {
  // 1. Navigate to app
  // 2. Verify English
  // 3. Click language toggle
  // 4. Verify Spanish
  // 5. Refresh page
  // 6. Verify Spanish persisted
});
```

#### 9. Error Handling Journey
```typescript
test('App handles network errors gracefully', async () => {
  // 1. Login
  // 2. Simulate network offline
  // 3. Try to load profile
  // 4. Verify retry logic
  // 5. Simulate network online
  // 6. Verify successful load
});
```

#### 10. Logout Journey
```typescript
test('User can logout', async () => {
  // 1. Login
  // 2. Verify dashboard
  // 3. Click logout
  // 4. Verify redirect to login
  // 5. Try to access protected route
  // 6. Verify redirect to login
});
```

---

## 🛠️ Testing Tools Setup

### Install Dependencies
```bash
# Unit & Integration Tests
npm install --save-dev @angular/core/testing
npm install --save-dev karma-coverage

# E2E Tests (Playwright)
npm install --save-dev @playwright/test
npx playwright install

# OR E2E Tests (Cypress)
npm install --save-dev cypress
```

### Configure Coverage
```json
// karma.conf.js
coverageReporter: {
  dir: require('path').join(__dirname, './coverage'),
  subdir: '.',
  reporters: [
    { type: 'html' },
    { type: 'text-summary' },
    { type: 'lcovonly' }
  ]
}
```

### Configure Playwright
```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'https://localhost:4400',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run start',
    port: 4400,
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## 📊 Coverage Goals

| Tipo | Objetivo | Prioridad |
|------|----------|-----------|
| **Services** | >90% | 🔴 Alta |
| **Guards** | >90% | 🔴 Alta |
| **Interceptors** | >90% | 🔴 Alta |
| **Components** | >80% | 🟡 Media |
| **Pipes** | >80% | 🟢 Baja |
| **Directives** | >80% | 🟢 Baja |
| **Overall** | >80% | 🔴 Alta |

---

## 🚀 Execution Plan

### Phase 1: Core Services & Interceptors (Week 1)
- [ ] AuthService
- [ ] TokenService
- [ ] LoggerService
- [ ] LoadingService
- [ ] ThemeService
- [ ] LanguageService
- [ ] AuthInterceptor
- [ ] ErrorInterceptor

### Phase 2: Guards & Auth Pages (Week 2)
- [ ] AuthGuard
- [ ] NoAuthGuard
- [ ] EmailVerifiedGuard
- [ ] LoginComponent
- [ ] RegisterComponent
- [ ] TwoFactorAuthComponent
- [ ] ForgotPasswordComponent
- [ ] ResetPasswordComponent
- [ ] ConfirmEmailComponent

### Phase 3: Profile & 2FA Pages (Week 3)
- [ ] ProfileComponent
- [ ] EditProfileComponent
- [ ] ChangePasswordComponent
- [ ] SecuritySettingsComponent
- [ ] ActiveSessionsComponent
- [ ] Setup2FAComponent
- [ ] Disable2FAComponent
- [ ] Regenerate2FAComponent

### Phase 4: Shared Components & Integration (Week 4)
- [ ] LoadingSpinnerComponent
- [ ] ErrorBoundaryComponent
- [ ] AuthLayoutComponent
- [ ] DashboardLayoutComponent
- [ ] LanguageToggleComponent
- [ ] ThemeToggleComponent
- [ ] Integration Tests (8)

### Phase 5: E2E Tests (Week 5)
- [ ] E2E Tests (10)
- [ ] CI/CD Integration
- [ ] Coverage Report

---

## 📝 Commands

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --code-coverage

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- --include='**/auth.service.spec.ts'

# Run E2E tests (Playwright)
npx playwright test

# Run E2E tests (Cypress)
npx cypress open
```

---

## ✅ Definition of Done

Un test está "done" cuando:
- [ ] Tiene >80% coverage
- [ ] Todos los casos edge están cubiertos
- [ ] Usa mocks/spies apropiadamente
- [ ] Es independiente (no depende de otros tests)
- [ ] Es rápido (<100ms por test)
- [ ] Tiene descripción clara
- [ ] Pasa en CI/CD

---

## 🎯 Next Steps

1. **Configurar tsconfig.spec.json** ✅ (Ya hecho)
2. **Instalar dependencias de testing**
3. **Crear primer test (AuthService)**
4. **Configurar coverage threshold**
5. **Integrar con CI/CD**

¿Empezamos con los tests de AuthService?
