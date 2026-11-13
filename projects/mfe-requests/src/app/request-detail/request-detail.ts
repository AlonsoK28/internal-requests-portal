import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { combineLatest, of, Subject, startWith, switchMap, catchError, tap } from 'rxjs';
import { ApiRequest, RequestsApiService } from 'shared';

@Component({
  selector: 'app-request-detail',
  imports: [DatePipe, DecimalPipe, MatButtonModule, MatCardModule, MatProgressSpinnerModule, RouterLink],
  templateUrl: './request-detail.html',
  styleUrl: './request-detail.scss',
})
export class RequestDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(RequestsApiService);
  private readonly reload = new Subject<void>();

  protected readonly request = signal<ApiRequest | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal('');

  constructor() {
    combineLatest([this.route.paramMap, this.reload.pipe(startWith(undefined))]).pipe(
      tap(() => { this.loading.set(true); this.error.set(''); this.request.set(null); }),
      switchMap(([params]) => {
        const id = Number(params.get('id'));
        if (!Number.isSafeInteger(id) || id <= 0) {
          this.error.set('El ID de la solicitud no es válido.');
          return of(null);
        }
        return this.api.get(id).pipe(
          catchError((error: unknown) => {
            this.error.set(error instanceof HttpErrorResponse && error.status === 500
              ? 'Ocurrió un error del servidor al cargar la solicitud.'
              : 'No se pudo cargar la solicitud.');
            return of(null);
          }),
        );
      }),
      takeUntilDestroyed(),
    ).subscribe(request => { this.request.set(request); this.loading.set(false); });
  }

  protected retry(): void { this.reload.next(); }
}
