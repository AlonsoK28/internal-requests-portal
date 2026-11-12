import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { API_BASE_URL } from './api.config';
import { SessionStore } from '../session/session.store';
import { normalizeRequest } from './amount';
import { ApiRequest, CreateRequest, RequestDecision, RequestPage, RequestQuery } from './api.models';

@Injectable({ providedIn: 'root' })
export class RequestsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly session = inject(SessionStore);

  list(query: RequestQuery = {}): Observable<RequestPage> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) params = params.set(key, String(value));
    }
    return this.http.get<ApiRequest[]>(`${this.baseUrl}/requests`, { params, headers: this.headers(), observe: 'response' }).pipe(
      map((response: HttpResponse<ApiRequest[]>) => ({
        items: (response.body ?? []).map(normalizeRequest),
        totalCount: this.totalCount(response.headers.get('X-Total-Count')),
      })),
    );
  }

  get(id: number): Observable<ApiRequest> {
    return this.http.get<ApiRequest>(`${this.baseUrl}/requests/${id}`, { headers: this.headers() }).pipe(map(normalizeRequest));
  }

  create(request: CreateRequest): Observable<ApiRequest> {
    return this.http.post<ApiRequest>(`${this.baseUrl}/requests`, request, { headers: this.headers() }).pipe(map(normalizeRequest));
  }

  decide(id: number, decision: RequestDecision): Observable<ApiRequest> {
    return this.http.patch<ApiRequest>(`${this.baseUrl}/requests/${id}`, decision, { headers: this.headers() }).pipe(map(normalizeRequest));
  }

  types(): Observable<unknown> {
    return this.http.get<unknown>(`${this.baseUrl}/catalog/types`, { headers: this.headers() });
  }

  private headers(): HttpHeaders {
    const token = this.session.token();
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }

  private totalCount(header: string | null): number | null {
    if (header === null) return null;
    const count = Number(header);
    return Number.isSafeInteger(count) && count >= 0 ? count : null;
  }
}
