import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthApiService, SessionStore } from 'shared';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { allowedDestination, landingPath } from 'shared';
import { A11yModule } from '@angular/cdk/a11y';


@Component({
  imports: [MatInputModule, MatIconModule, MatFormFieldModule, ReactiveFormsModule, MatButtonModule, MatProgressSpinnerModule, A11yModule],
  selector: 'app-login',
  styleUrl: './login.scss',
  templateUrl: './login.html',
})
export class Login {
  private readonly authApi = inject(AuthApiService);
  readonly session = inject(SessionStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly email = new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] });
  readonly password = new FormControl('', { nonNullable: true, validators: [Validators.required] });
  readonly submitting = signal(false);
  readonly errorMessage = signal('');

  login(): void {
    if (this.submitting()) return;
    if (this.email.invalid || this.password.invalid) {
      this.email.markAsTouched();
      this.password.markAsTouched();
      return;
    }

    this.errorMessage.set('');
    this.submitting.set(true);
    this.authApi.login({ email: this.email.value.trim(), password: this.password.value }).subscribe({
      next: () => {
        this.password.reset();
        this.submitting.set(false);
        const role = this.session.role();
        if (role) {
          const destination = allowedDestination(this.route.snapshot.queryParamMap.get('returnUrl'), role)
            ?? landingPath(role);
          void this.router.navigateByUrl(destination);
        }
      },
      error: (error: unknown) => {
        this.errorMessage.set(error instanceof HttpErrorResponse && error.status === 401
          ? 'Correo o contraseña incorrectos.'
          : error instanceof HttpErrorResponse && error.status === 422
            ? 'Ingresa un correo y una contraseña válidos.'
            : 'No se pudo iniciar sesión. Inténtalo de nuevo.');
        this.submitting.set(false);
      },
    });
  }
}
