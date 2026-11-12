import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { DataTableComponent, RequestColumn, RequestListStore, RequestStatus, RequestType, RequestsApiService, TableAction } from 'shared';

@Component({
  selector: 'app-approvals',
  imports: [DataTableComponent, MatFormFieldModule, MatInputModule, MatOptionModule, MatSelectModule, MatPaginatorModule],
  providers: [RequestListStore],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly list = inject(RequestListStore);
  private readonly api = inject(RequestsApiService);
  protected readonly columns: RequestColumn[] = ['id', 'type', 'requesterName', 'createdAt', 'status', 'actions'];
  protected readonly decisionError = signal('');
  protected readonly decidingId = signal<number | null>(null);

  constructor() { this.list.start('pending'); }

  protected onSearch(event: Event): void { this.list.setSearch((event.target as HTMLInputElement).value); }
  protected onStatus(value: RequestStatus | ''): void { this.list.setStatus(value); }
  protected onType(value: RequestType | ''): void { this.list.setType(value); }
  protected onPage(event: PageEvent): void { this.list.setPage(event.pageIndex, event.pageSize); }

  protected onAction(action: TableAction): void {
    if (this.decidingId() !== null) return;
    const decisionComment = action.kind === 'reject' ? window.prompt('Motivo del rechazo:') : null;
    if (action.kind === 'reject' && !decisionComment?.trim()) return;
    this.decidingId.set(action.request.id);
    this.decisionError.set('');
    const decision = action.kind === 'approve'
      ? { status: 'approved' as const, version: action.request.version }
      : { status: 'rejected' as const, version: action.request.version, decisionComment: decisionComment!.trim() };
    this.api.decide(action.request.id, decision).subscribe({
      next: () => { this.decidingId.set(null); this.list.retry(); },
      error: () => { this.decidingId.set(null); this.decisionError.set('No se pudo guardar la decisión. Vuelve a intentarlo.'); },
    });
  }
}

@Component({ selector: 'app-root', imports: [RouterOutlet], template: '<router-outlet />' })
export class Root {}
