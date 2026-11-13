import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiRequest, ConflictDialogComponent, DataTableComponent, RequestColumn, RequestListStore, RequestStatus, RequestType, RequestsApiService, TableAction, VersionConflictError } from 'shared';

function versionConflict(error: unknown): VersionConflictError | null {
  if (!(error instanceof HttpErrorResponse) || error.status !== 409 ||
      typeof error.error !== 'object' || error.error === null) return null;
  const body = error.error as Record<string, unknown>;
  if (body['code'] !== 'VERSION_CONFLICT' ||
      typeof body['current'] !== 'object' || body['current'] === null) return null;
  const current = body['current'] as Record<string, unknown>;
  if (typeof current['id'] !== 'number' || typeof current['title'] !== 'string' ||
      typeof current['version'] !== 'number' ||
      !['pending', 'approved', 'rejected'].includes(String(current['status']))) return null;
  return { code: 'VERSION_CONFLICT', message: typeof body['message'] === 'string' ? body['message'] : undefined,
    current: body['current'] as ApiRequest };
}

@Component({
  selector: 'app-approvals',
  imports: [
    DataTableComponent, 
    MatFormFieldModule, 
    MatInputModule, 
    MatOptionModule, 
    MatSelectModule, 
    MatPaginatorModule,
    MatIconModule
  ],
  providers: [RequestListStore],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly list = inject(RequestListStore);
  private readonly api = inject(RequestsApiService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  protected readonly columns = computed<readonly RequestColumn[]>(() => {
    const base: RequestColumn[] = ['id', 'title', 'type', 'requesterName', 'createdAt', 'status'];
    return this.list.status() === 'pending' ? [...base, 'actions'] : base;
  });
  protected readonly decisionError = signal('');
  protected readonly decidingId = signal<number | null>(null);

  constructor() { this.list.start('pending'); }

  protected onSearch(event: Event): void { 
    this.list.setSearch((event.target as HTMLInputElement).value); 
  }
  protected onStatus(value: RequestStatus | ''): void { 
    this.list.setStatus(value); 
  }
  protected onType(value: RequestType | ''): void { 
    this.list.setType(value); 
  }
  protected onPage(event: PageEvent): void { 
    this.list.setPage(event.pageIndex, event.pageSize); 
  }

  protected onAction(action: TableAction): void {
    if (this.decidingId() !== null) return;
    const decisionComment = action.kind === 'reject' ? window.prompt('Motivo del rechazo:') : null;

    if (action.kind === 'reject' && !decisionComment?.trim()) return;

    this.decidingId.set(action.request.id);
    this.decisionError.set('');
    const decision = action.kind === 'approve' ? { status: 'approved' as const, version: action.request.version } : { status: 'rejected' as const, version: action.request.version, decisionComment: decisionComment!.trim() };
    
    this.api.decide(action.request.id, decision)
    .subscribe({
      next: updated => {
        this.decidingId.set(null);
        this.list.applyUpdatedRequest(updated);
        const message = updated.status === 'approved' ? 'Solicitud aprobada.' : updated.status === 'rejected' ? 'Solicitud rechazada.' : 'Solicitud actualizada.';
        this.snackBar.open(message, 'Cerrar', { duration: 4000, politeness: 'polite' });
      },
      error: (error: unknown) => {
        this.decidingId.set(null);
        const conflict = versionConflict(error);
        if (conflict && conflict.current.id === action.request.id) {
          this.list.applyUpdatedRequest(conflict.current);
          const config: MatDialogConfig = { data: conflict, width: 'min(32rem, 95vw)', autoFocus: 'first-tabbable' };
          this.dialog.open(ConflictDialogComponent, config);
          return;
        }
        this.decisionError.set('No se pudo guardar la decisión. Vuelve a intentarlo.');
      },
    });
  }
}

@Component({ selector: 'app-root', imports: [RouterOutlet], template: '<router-outlet />' })
export class Root {}
