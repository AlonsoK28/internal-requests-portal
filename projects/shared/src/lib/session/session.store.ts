import { computed, inject, Injectable, signal } from '@angular/core';
import { LoginResponse } from '../api/api.models';

const STORAGE_KEY = 'internal-requests-session';

function validSession(value: unknown): value is LoginResponse {
  if (typeof value !== 'object' || value === null) return false;
  const session = value as Record<string, unknown>;
  if (typeof session['token'] !== 'string' || !session['token'] ||
      typeof session['expiresAt'] !== 'string' || Date.parse(session['expiresAt']) <= Date.now()) return false;
  const user = session['user'];
  if (typeof user !== 'object' || user === null) return false;
  const fields = user as Record<string, unknown>;
  return typeof fields['id'] === 'number' && typeof fields['name'] === 'string' &&
    typeof fields['email'] === 'string' && typeof fields['department'] === 'string' &&
    (fields['role'] === 'employee' || fields['role'] === 'approver');
}

@Injectable({ providedIn: 'root' })
export class SessionStore {
  private readonly session = signal<LoginResponse | null>(this.restore());
  private readonly clock = signal(Date.now());
  private timer: ReturnType<typeof setTimeout> | undefined;

  readonly user = computed(() => this.isAuthenticated() ? this.session()?.user ?? null : null);
  readonly role = computed(() => this.user()?.role ?? null);
  readonly token = computed(() => this.isAuthenticated() ? this.session()?.token ?? null : null);
  readonly isAuthenticated = computed(() => {
    const session = this.session();
    return session !== null && Date.parse(session.expiresAt) > this.clock();
  });

  constructor() { this.scheduleExpiry(); }

  setSession(session: LoginResponse): void {
    if (!validSession(session)) {
      this.clear();
      return;
    }
    this.session.set(session);
    this.clock.set(Date.now());
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session)); } catch { /* Storage unavailable. */ }
    this.scheduleExpiry();
  }

  clear(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = undefined;
    this.session.set(null);
    this.clock.set(Date.now());
    try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* Storage unavailable. */ }
  }

  private restore(): LoginResponse | null {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (!stored) return null;
      const value: unknown = JSON.parse(stored);
      if (validSession(value)) return value;
      sessionStorage.removeItem(STORAGE_KEY);
    } catch { /* Missing or inaccessible storage. */ }
    return null;
  }

  private scheduleExpiry(): void {
    if (this.timer) clearTimeout(this.timer);
    const session = this.session();
    if (!session) return;
    const remaining = Date.parse(session.expiresAt) - Date.now();
    if (remaining <= 0) {
      this.clear();
      return;
    }
    this.timer = setTimeout(() => this.clear(), remaining);
  }
}
