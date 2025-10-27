import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '@environments/environment';
import { UserDto } from '@core/models/user.model';
import { AuditLogsResponse } from '@core/models/audit-log.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getUsers(page: number = 1, take: number = 10, ids?: string[]): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('take', take.toString());

    if (ids && ids.length > 0) {
      params = params.set('ids', ids.join(','));
    }

    return this.http.get(`${this.API_URL}/v1/users`, { params });
  }

  getUser(id: string): Observable<UserDto> {
    return this.http.get<UserDto>(`${this.API_URL}/v1/users/${id}`);
  }

  getUserAuditLogs(id: string, page: number = 1, pageSize: number = 50): Observable<AuditLogsResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    return this.http.get<AuditLogsResponse>(`${this.API_URL}/v1/users/${id}/audit-logs`, { params });
  }
}
