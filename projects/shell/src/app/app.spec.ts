import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { API_BASE_URL, SessionStore } from 'shared';
import { App } from './app';
import { AccessNotice } from './access-notice';

@Component({ template: '' })
class EmptyRoute {}

@Component({ template: '<table aria-label="Solicitudes"><tr><td>Dato protegido</td></tr></table>' })
class ProtectedRoute {}

describe('App', () => {
  beforeEach(async () => {
    sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([
        { path: 'login', component: EmptyRoute },
        { path: 'approvals', component: ProtectedRoute },
      ]),
        { provide: API_BASE_URL, useValue: 'https://api.test' }],
    }).compileComponents();
  });

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    TestBed.inject(SessionStore).clear();
  });

  it('shows logout only when authenticated and clears the session on click', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('button[type="button"]')).toBeNull();

    const session = TestBed.inject(SessionStore);
    session.setSession({ token: 'token', expiresAt: new Date(Date.now() + 900_000).toISOString(),
      user: { id: 1, name: 'Ana', email: 'ana@demo.com', role: 'employee', department: 'Finanzas' } });
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button[type="button"]') as HTMLButtonElement;
    expect(button.textContent).toContain('Cerrar sesión');
    button.click();

    const request = TestBed.inject(HttpTestingController).expectOne('https://api.test/auth/logout');
    fixture.detectChanges();
    expect(button.classList.contains('mat-mdc-button-progress-indicator-shown')).toBe(true);
    expect(request.request.headers.get('Authorization')).toBe('Bearer token');
    request.flush(null, { status: 204, statusText: 'No Content' });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(session.isAuthenticated()).toBe(false);
    expect(TestBed.inject(Router).url).toBe('/login');
    expect(fixture.nativeElement.querySelector('button[type="button"]')).toBeNull();
  });

  it('redirects to login even when logout fails', async () => {
    const session = TestBed.inject(SessionStore);
    session.setSession({ token: 'token', expiresAt: new Date(Date.now() + 900_000).toISOString(),
      user: { id: 1, name: 'Ana', email: 'ana@demo.com', role: 'employee', department: 'Finanzas' } });
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    (fixture.nativeElement.querySelector('button[type="button"]') as HTMLButtonElement).click();
    TestBed.inject(HttpTestingController).expectOne('https://api.test/auth/logout')
      .flush(null, { status: 500, statusText: 'Server Error' });
    await fixture.whenStable();
    expect(session.isAuthenticated()).toBe(false);
    expect(TestBed.inject(Router).url).toBe('/login');
  });

  it('announces access denied without changing the page', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    TestBed.inject(AccessNotice).deny();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain('Acceso denegado');
  });

  it('removes protected content and returns to login when the session expires', async () => {
    const session = TestBed.inject(SessionStore);
    session.setSession({ token: 'token', expiresAt: new Date(Date.now() + 900_000).toISOString(),
      user: { id: 1, name: 'Ana', email: 'ana@demo.com', role: 'approver', department: 'Finanzas' } });
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await TestBed.inject(Router).navigateByUrl('/approvals?status=pending&q=audito');
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('table')).not.toBeNull();

    session.clear();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('table')).toBeNull();
    await fixture.whenStable();
    expect(TestBed.inject(Router).url)
      .toBe('/login?returnUrl=%2Fapprovals%3Fstatus%3Dpending%26q%3Daudito');
  });
});
