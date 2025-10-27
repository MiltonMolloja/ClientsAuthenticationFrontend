export interface AuditLog {
  id: number;
  action: string;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  failureReason?: string;
}

export interface AuditLogsResponse {
  auditLogs: AuditLog[];
  page: number;
  pageSize: number;
  total: number;
}
