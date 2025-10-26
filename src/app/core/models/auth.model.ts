// Authentication models - will be fully implemented in Part 2
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    username: string;
    role: string;
  };
  expiresIn: number;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface TokenPayload {
  sub: string;
  email: string;
  role: string;
  exp: number;
  iat: number;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface TwoFactorVerifyRequest {
  userId: string;
  code: string;
}

export interface TwoFactorSetupResponse {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}
