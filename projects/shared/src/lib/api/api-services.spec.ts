import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthApiService } from './auth-api.service';
import { RequestsApiService } from './requests-api.service';
import { SessionStore } from '../session/session.store';
import { LoginResponse } from './api.models';
import { API_BASE_URL } from './api.config';

const login: LoginResponse = {
  token: 'token',
  expiresAt: new Date(Date.now() + 900_000).toISOString(),
  user: { id: 1, name: 'Ana', email: 'ana@demo.com', role: 'employee', department: 'Finanzas' },
};

describe('API services', () => {
  let http: HttpTestingController;
  let auth: AuthApiService;
  let requests: RequestsApiService;
  let session: SessionStore;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_BASE_URL, useValue: 'https://api.test' }],
    });
    http = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthApiService);
    requests = TestBed.inject(RequestsApiService);
    session = TestBed.inject(SessionStore);
  });

  afterEach(() => { http.verify(); session.clear(); });

  it('stores login and sends the token to protected endpoints', () => {
    auth.login({ email: 'ana@demo.com', password: 'Demo123!' }).subscribe();
    http.expectOne('https://api.test/auth/login').flush(login);
    expect(session.isAuthenticated()).toBe(true);
    auth.me().subscribe();
    expect(http.expectOne('https://api.test/auth/me').request.headers.get('Authorization')).toBe('Bearer token');
  });

  it('normalizes amount and reads the pagination header', () => {
    session.setSession(login);
    let result: number | undefined;
    let total: number | null | undefined;
    requests.list({ _page: 2, _limit: 10 }).subscribe(page => {
      result = page.items[0]?.amount;
      total = page.totalCount;
    });
    const call = http.expectOne(req => req.url === 'https://api.test/requests');
    expect(call.request.params.get('_page')).toBe('2');
    expect(call.request.headers.get('Authorization')).toBe('Bearer token');
    call.flush([{ id: 37, title: 'Viaje', type: 'travel', status: 'pending', requesterId: 2,
      requesterName: 'Bruno', createdAt: '', updatedAt: '', version: 1,
      details: { destination: 'Bogotá', startDate: '2026-12-15', endDate: '2026-12-18' }, amount: '8400.00' }],
      { headers: { 'X-Total-Count': '42' } });
    expect(result).toBe(8400);
    expect(total).toBe(42);
  });

  it('clears the session after logout', () => {
    session.setSession(login);
    auth.logout().subscribe();
    const call = http.expectOne('https://api.test/auth/logout');
    expect(call.request.headers.get('Authorization')).toBe('Bearer token');
    call.flush(null, { status: 204, statusText: 'No Content' });
    expect(session.isAuthenticated()).toBe(false);
  });
});
