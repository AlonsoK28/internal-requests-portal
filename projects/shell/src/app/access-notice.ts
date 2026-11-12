import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AccessNotice {
  readonly message = signal('');

  deny(): void {
    this.message.set('Acceso denegado. No tienes permiso para realizar esta acción.');
  }

  clear(): void {
    this.message.set('');
  }
}
