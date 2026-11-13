import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { UserRole } from '../api/api.models';
import { SessionStore } from './session.store';

export function landingPath(role: UserRole): string {
  return role === 'approver' ? '/approvals' : '/requests';
}

export function requireRoles(...roles: UserRole[]): CanMatchFn {
  return () => {
    const session = inject(SessionStore);
    const router = inject(Router);
    const role = session.role();
    if (!session.isAuthenticated() || !role) {
      return router.parseUrl('/');
    }
    return roles.includes(role) ? true : router.parseUrl(landingPath(role));
  };
}

export const requestsGuard = requireRoles('employee', 'approver');
export const approvalsGuard = requireRoles('approver');

export const homeGuard: CanMatchFn = () => {
  const session = inject(SessionStore);
  const role = session.role();
  if (!session.isAuthenticated() || !role) return true;
  const router = inject(Router);
  return router.parseUrl(landingPath(role));
};
