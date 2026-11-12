import { TestBed } from '@angular/core/testing';
import { CanMatchFn, provideRouter, Router, UrlSegment, UrlTree } from '@angular/router';
import { LoginResponse, UserRole } from '../api/api.models';
import { allowedDestination, approvalsGuard, homeGuard, landingPath, requestsGuard } from './role.guard';
import { SessionStore } from './session.store';

const snapshot = {} as Parameters<CanMatchFn>[2];

const sessionFor = (role: UserRole): LoginResponse => ({
  token: 'token',
  expiresAt: new Date(Date.now() + 900_000).toISOString(),
  user: { id: 1, name: 'Ana', email: 'ana@demo.com', role, department: 'Finanzas' },
});

describe('role guards', () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  afterEach(() => TestBed.inject(SessionStore).clear());

  it('redirects anonymous users to root with the requested destination', () => {
    const router = TestBed.inject(Router);
    const result = TestBed.runInInjectionContext(() => requestsGuard(
      { path: 'requests' }, [new UrlSegment('requests', {})], snapshot,
    ));
    expect(router.serializeUrl(result as UrlTree))
      .toBe('/?returnUrl=%2Frequests');
  });

  it.each(['employee', 'approver'] as const)('allows %s to open requests', role => {
    TestBed.inject(SessionStore).setSession(sessionFor(role));
    expect(TestBed.runInInjectionContext(() => requestsGuard({ path: 'requests' }, [], snapshot))).toBe(true);
  });

  it('allows approvers and redirects employees away from approvals', () => {
    const store = TestBed.inject(SessionStore);
    const router = TestBed.inject(Router);
    store.setSession(sessionFor('employee'));
    const denied = TestBed.runInInjectionContext(() => approvalsGuard({ path: 'approvals' }, [], snapshot));
    expect(router.serializeUrl(denied as UrlTree)).toBe('/requests');
    store.setSession(sessionFor('approver'));
    expect(TestBed.runInInjectionContext(() => approvalsGuard({ path: 'approvals' }, [], snapshot))).toBe(true);
  });

  it('uses a return URL only when the role can access it', () => {
    expect(landingPath('employee')).toBe('/requests');
    expect(landingPath('approver')).toBe('/approvals');
    expect(allowedDestination('/requests?page=2', 'employee')).toBe('/requests?page=2');
    expect(allowedDestination('/approvals', 'employee')).toBeNull();
    expect(allowedDestination('/approvals', 'approver')).toBe('/approvals');
    expect(allowedDestination('//evil.example', 'approver')).toBeNull();
  });

  it('keeps anonymous users at home and redirects authenticated users by role', () => {
    const router = TestBed.inject(Router);
    expect(TestBed.runInInjectionContext(() => homeGuard({ path: '' }, [], snapshot))).toBe(true);
    TestBed.inject(SessionStore).setSession(sessionFor('approver'));
    const result = TestBed.runInInjectionContext(() => homeGuard({ path: '' }, [], snapshot));
    expect(router.serializeUrl(result as UrlTree)).toBe('/approvals');
  });
});
