import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '@environments/environment';
import { SessionsResponse } from '@core/models/session.model';

@Injectable({
  providedIn: 'root',
})
export class SessionService {
  // Use identityServerUrl for Identity API calls (sessions, etc.)
  private readonly API_URL = environment.identityServerUrl || environment.apiUrl;

  constructor(private http: HttpClient) {}

  getActiveSessions(refreshToken?: string): Observable<SessionsResponse> {
    const headers = refreshToken ? new HttpHeaders({ 'Refresh-Token': refreshToken }) : undefined;

    return this.http.get<SessionsResponse>(`${this.API_URL}/v1/identity/sessions`, { headers });
  }

  revokeSession(sessionId: number): Observable<any> {
    return this.http.delete(`${this.API_URL}/v1/identity/sessions/${sessionId}`);
  }

  revokeAllSessions(currentRefreshToken?: string): Observable<any> {
    const headers = currentRefreshToken
      ? new HttpHeaders({ 'Refresh-Token': currentRefreshToken })
      : undefined;

    return this.http.delete(`${this.API_URL}/v1/identity/sessions/all`, { headers });
  }
}
