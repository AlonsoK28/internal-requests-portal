import { Component, effect, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthApiService, SessionStore } from 'shared';
import { Login } from './components/login/login';
import { AccessNotice } from './access-notice';

@Component({
  imports: [Login, MatButtonModule, MatProgressSpinnerModule, MatToolbarModule, RouterOutlet, RouterLink],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  private readonly authApi = inject(AuthApiService);
  private readonly router = inject(Router);
  protected readonly session = inject(SessionStore);
  protected readonly accessNotice = inject(AccessNotice);
  protected readonly loggingOut = signal(false);
  private wasAuthenticated = this.session.isAuthenticated();

  constructor() {
    effect(() => {
      const authenticated = this.session.isAuthenticated();
      if (this.wasAuthenticated && !authenticated && !this.loggingOut()) {
        const destination = this.router.url;
        if (destination.startsWith('/requests') || destination.startsWith('/approvals')) {
          void this.router.navigate(['/login'], {
            queryParams: { returnUrl: destination },
            replaceUrl: true,
          });
        }
      }
      this.wasAuthenticated = authenticated;
    });
  }

  protected logout(): void {
    if (this.loggingOut()) return;
    this.loggingOut.set(true);
    this.authApi.logout().pipe(finalize(() => {
      void this.router.navigateByUrl('/login', { replaceUrl: true })
        .finally(() => this.loggingOut.set(false));
    })).subscribe({ error: () => undefined });
  }
}
