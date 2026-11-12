import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { UserRole } from '../api/api.models';
import { SessionStore } from './session.store';

export function landingPath(role: UserRole): string {
  return role === 'approver' ? '/approvals' : '/requests';
}

export function allowedDestination(destination: string | null, role: UserRole): string | null {
  if (!destination || !destination.startsWith('/') || destination.startsWith('//')) return null;
  try {
    const url = new URL(destination, 'https://local.invalid');
    if (url.origin !== 'https://local.invalid') return null;
    const feature = url.pathname.split('/')[1];
    return feature === 'requests' || (feature === 'approvals' && role === 'approver')
      ? destination : null;
  } catch {
    return null;
  }
}

export function requireRoles(...roles: UserRole[]): CanMatchFn {
  return (_route, segments) => {
    const session = inject(SessionStore);
    const router = inject(Router);
    const role = session.role();
    if (!session.isAuthenticated() || !role) {
      const destination = router.getCurrentNavigation()?.initialUrl.toString()
        ?? `/${segments.map(segment => segment.path).join('/')}`;
      return router.createUrlTree(['/'], { queryParams: { returnUrl: destination } });
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
  const requested = router.getCurrentNavigation()?.initialUrl.queryParams['returnUrl'];
  const destination = allowedDestination(typeof requested === 'string' ? requested : null, role)
    ?? landingPath(role);
  return router.parseUrl(destination);
};
