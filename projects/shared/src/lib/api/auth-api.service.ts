import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, finalize, tap } from 'rxjs';
import { SessionStore } from '../session/session.store';
import { API_BASE_URL } from './api.config';
import { ApiUser, LoginRequest, LoginResponse } from './api.models';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly session = inject(SessionStore);

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/auth/login`, credentials).pipe(
      tap(response => this.session.setSession(response)),
    );
  }

  me(): Observable<ApiUser> {
    return this.http.get<ApiUser>(`${this.baseUrl}/auth/me`, { headers: this.headers() });
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/auth/logout`, null, { headers: this.headers() }).pipe(
      finalize(() => this.session.clear()),
    );
  }

  private headers(): HttpHeaders {
    const token = this.session.token();
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }
}
