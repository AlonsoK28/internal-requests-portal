import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { LoginResponse } from '../api/api.models';
import { SessionStore } from './session.store';

const session: LoginResponse = {
  token: 'abc', expiresAt: new Date(Date.now() + 900_000).toISOString(),
  user: { id: 1, name: 'Ana', email: 'ana@demo.com', role: 'employee', department: 'Finanzas' },
};

describe('SessionStore', () => {
  beforeEach(() => { sessionStorage.clear(); TestBed.resetTestingModule(); });
  afterEach(() => { TestBed.inject(SessionStore).clear(); vi.useRealTimers(); });

  it('persists and restores a valid session', () => {
    const first = TestBed.inject(SessionStore);
    first.setSession(session);
    expect(first.role()).toBe('employee');
    TestBed.resetTestingModule();
    expect(TestBed.inject(SessionStore).token()).toBe('abc');
  });

  it('rejects an expired stored token', () => {
    sessionStorage.setItem('internal-requests-session', JSON.stringify({ ...session, expiresAt: '2020-01-01T00:00:00.000Z' }));
    expect(TestBed.inject(SessionStore).isAuthenticated()).toBe(false);
    expect(sessionStorage.length).toBe(0);
  });

  it('expires an active session at its deadline', () => {
    vi.useFakeTimers();
    const now = Date.now();
    vi.setSystemTime(now);
    const store = TestBed.inject(SessionStore);
    store.setSession({ ...session, expiresAt: new Date(now + 1000).toISOString() });
    vi.advanceTimersByTime(1001);
    expect(store.isAuthenticated()).toBe(false);
    expect(store.user()).toBeNull();
    expect(sessionStorage.length).toBe(0);
  });
});
