export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  succeeded: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
  requires2FA?: boolean;
  userId?: string;
  message?: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface TwoFactorAuthRequest {
  userId: string;
  code: string;
  rememberDevice?: boolean;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ConfirmEmailRequest {
  userId: string;
  token: string;
}

export interface Enable2FAResponse {
  succeeded: boolean;
  secret: string;
  qrCodeUri: string;
  backupCodes: string[];
}

export interface Disable2FARequest {
  password: string;
  code: string;
}

export interface RegenerateBackupCodesRequest {
  password: string;
  code: string;
}

export interface RegenerateBackupCodesResponse {
  succeeded: boolean;
  backupCodes: string[];
}
