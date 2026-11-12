import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { API_BASE_URL, SessionStore } from 'shared';
import { provideRouter, Router } from '@angular/router';
import { Login } from './login';

@Component({ template: '' })
class TestPage {}

describe('Login', () => {
  let fixture: ComponentFixture<Login>;
  let http: HttpTestingController;
  let session: SessionStore;

  beforeEach(async () => {
    sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideHttpClient(), provideHttpClientTesting(),
        provideRouter([{ path: 'requests', component: TestPage }, { path: 'approvals', component: TestPage },
          { path: 'login', component: TestPage }]),
        { provide: API_BASE_URL, useValue: 'https://api.test' }],
    }).compileComponents();
    fixture = TestBed.createComponent(Login);
    http = TestBed.inject(HttpTestingController);
    session = TestBed.inject(SessionStore);
    await fixture.whenStable();
  });

  afterEach(() => { http.verify(); session.clear(); });

  it('submits valid credentials and shows the authenticated user', async () => {
    fixture.componentInstance.email.setValue('ana@demo.com');
    fixture.componentInstance.password.setValue('Demo123!');
    fixture.nativeElement.querySelector('button[type="submit"]').click();
    const call = http.expectOne('https://api.test/auth/login');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('button[type="submit"]').classList.contains('mat-mdc-button-progress-indicator-shown')).toBe(true);
    expect(call.request.body).toEqual({ email: 'ana@demo.com', password: 'Demo123!' });
    call.flush({ token: 'token', expiresAt: new Date(Date.now() + 900_000).toISOString(),
      user: { id: 1, name: 'Ana', email: 'ana@demo.com', role: 'employee', department: 'Finanzas' } });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(session.isAuthenticated()).toBe(true);
    expect(fixture.nativeElement.querySelector('.session-name')?.textContent).toContain('Ana');
    expect(fixture.nativeElement.querySelector('[role="status"]')?.textContent).toContain('(employee)');
    expect(fixture.componentInstance.email.value).toBe('');
    session.clear();
    fixture.detectChanges();
    expect((fixture.nativeElement.querySelector('input[type="email"]') as HTMLInputElement).value).toBe('');
    expect(TestBed.inject(Router).url).toBe('/requests');
  });

  it('sends approvers to approvals after login', async () => {
    fixture.componentInstance.email.setValue('ana@demo.com');
    fixture.componentInstance.password.setValue('Demo123!');
    fixture.nativeElement.querySelector('button[type="submit"]').click();
    http.expectOne('https://api.test/auth/login').flush({
      token: 'token', expiresAt: new Date(Date.now() + 900_000).toISOString(),
      user: { id: 1, name: 'Ana', email: 'ana@demo.com', role: 'approver', department: 'Finanzas' },
    });
    await fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/approvals');
  });

  it('returns to the requested URL after login', async () => {
    await TestBed.inject(Router).navigateByUrl('/login?returnUrl=%2Frequests%3Ftab%3Dopen');
    fixture.componentInstance.email.setValue('ana@demo.com');
    fixture.componentInstance.password.setValue('Demo123!');
    fixture.nativeElement.querySelector('button[type="submit"]').click();
    http.expectOne('https://api.test/auth/login').flush({
      token: 'token', expiresAt: new Date(Date.now() + 900_000).toISOString(),
      user: { id: 1, name: 'Ana', email: 'ana@demo.com', role: 'employee', department: 'Finanzas' },
    });
    await fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/requests?tab=open');
  });

  it('does not submit invalid fields', () => {
    fixture.nativeElement.querySelector('button[type="submit"]').click();
    http.expectNone('https://api.test/auth/login');
    expect(fixture.componentInstance.email.touched).toBe(true);
  });

  it('submits from the password field without clearing the email', () => {
    fixture.componentInstance.email.setValue('ana@demo.com');
    fixture.componentInstance.password.setValue('Demo123!');
    fixture.detectChanges();
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    expect(form.querySelectorAll('button:not([type])')).toHaveLength(0);
    form.requestSubmit();
    expect(fixture.componentInstance.email.value).toBe('ana@demo.com');
    const request = http.expectOne('https://api.test/auth/login');
    expect(request.request.body).toEqual({ email: 'ana@demo.com', password: 'Demo123!' });
    request.flush({}, { status: 401, statusText: 'Unauthorized' });
  });

  it('shows a credentials error after a 401 response', async () => {
    fixture.componentInstance.email.setValue('ana@demo.com');
    fixture.componentInstance.password.setValue('incorrecta');
    fixture.nativeElement.querySelector('button[type="submit"]').click();
    http.expectOne('https://api.test/auth/login').flush({}, { status: 401, statusText: 'Unauthorized' });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('Correo o contraseña incorrectos.');
  });
});
