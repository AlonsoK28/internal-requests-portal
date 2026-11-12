import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AuthApiService, SessionStore } from 'shared';
import { Login } from './components/login/login';

@Component({
  imports: [Login, MatButtonModule, MatProgressSpinnerModule, MatToolbarModule, RouterOutlet, RouterLink],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  private readonly authApi = inject(AuthApiService);
  protected readonly session = inject(SessionStore);
  protected readonly loggingOut = signal(false);

  protected logout(): void {
    if (this.loggingOut()) return;
    this.loggingOut.set(true);
    this.authApi.logout().subscribe({
      next: () => this.loggingOut.set(false),
      error: () => this.loggingOut.set(false),
    });
  }
}
