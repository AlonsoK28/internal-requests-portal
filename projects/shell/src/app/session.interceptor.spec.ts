import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NavigationEnd, provideRouter, Router } from '@angular/router';
import { filter, firstValueFrom } from 'rxjs';
import { SessionStore } from 'shared';
import { AccessNotice } from './access-notice';
import { sessionInterceptor } from './session.interceptor';

@Component({ template: '' })
class TestPage {}

describe('sessionInterceptor', () => {
  let http: HttpTestingController;
  let client: HttpClient;
  let session: SessionStore;
  let router: Router;
  let notice: AccessNotice;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([sessionInterceptor])),
        provideHttpClientTesting(),
        provideRouter([
          { path: 'requests', component: TestPage },
          { path: 'login', component: TestPage },
        ]),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    client = TestBed.inject(HttpClient);
    session = TestBed.inject(SessionStore);
    router = TestBed.inject(Router);
    notice = TestBed.inject(AccessNotice);
    session.setSession({
      token: 'abc', expiresAt: new Date(Date.now() + 900_000).toISOString(),
      user: { id: 1, name: 'Ana', email: 'ana@demo.com', role: 'employee', department: 'Finanzas' },
    });
  });

  afterEach(() => {
    http.verify();
    session.clear();
  });

  it('adds the current bearer token', () => {
    client.get('/api/requests').subscribe();
    const request = http.expectOne('/api/requests');
    expect(request.request.headers.get('Authorization')).toBe('Bearer abc');
    request.flush([]);
  });

  it('clears the session and redirects to login on a 401', async () => {
    await router.navigateByUrl('/requests?tab=open');
    const redirected = firstValueFrom(router.events.pipe(filter(event => event instanceof NavigationEnd)));
    let receivedError: unknown;
    client.get('/api/requests').subscribe({ error: error => receivedError = error });
    http.expectOne('/api/requests').flush({}, { status: 401, statusText: 'Unauthorized' });
    await redirected;
    expect(receivedError).toBeInstanceOf(HttpErrorResponse);
    expect(session.isAuthenticated()).toBe(false);
    expect(router.url).toBe('/login?returnUrl=%2Frequests%3Ftab%3Dopen');
  });

  it('shows an access denied message on a 403 without navigating', async () => {
    await router.navigateByUrl('/requests');
    let receivedError: unknown;
    client.get('/api/requests').subscribe({ error: error => receivedError = error });
    http.expectOne('/api/requests').flush({}, { status: 403, statusText: 'Forbidden' });
    expect(receivedError).toBeInstanceOf(HttpErrorResponse);
    expect(notice.message()).toContain('Acceso denegado');
    expect(router.url).toBe('/requests');
    expect(session.isAuthenticated()).toBe(true);
  });

  it('leaves invalid login responses to the login form', () => {
    client.post('/api/auth/login', {}).subscribe({ error: () => undefined });
    http.expectOne('/api/auth/login').flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(session.isAuthenticated()).toBe(true);
    expect(router.url).toBe('/');
  });
});
