export interface Session {
  id: number;
  deviceInfo: string;
  ipAddress: string;
  createdAt: Date;
  expiresAt: Date;
  isCurrent: boolean;
  refreshToken?: string;
}

export interface SessionsResponse {
  sessions: Session[];
}
