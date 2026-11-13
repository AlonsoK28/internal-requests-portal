import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideRouter } from '@angular/router';
import { of, Subject } from 'rxjs';
import { ApiRequest, ConflictDialogComponent, RequestsApiService } from 'shared';
import { App } from './app';

const pending: ApiRequest = { id: 67, title: 'Carpeta compartida de Finanzas', type: 'access',
  status: 'pending', requesterId: 2, requesterName: 'Bruno Díaz', createdAt: '2026-10-01T03:19:05.000Z',
  updatedAt: '2026-10-01T03:19:05.000Z', version: 1,
  details: { system: 'SharePoint', justification: 'Necesario para las tareas del puesto' } };

describe('App', () => {
  it('loads pending approvals initially', async () => {
    const list = vi.fn().mockReturnValue(of({ items: [], totalCount: 0 }));
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), { provide: RequestsApiService, useValue: { list } }],
    }).compileComponents();
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    expect(list).toHaveBeenCalledWith(expect.objectContaining({ status: 'pending', _page: 1 }));
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Aprobaciones');
  });

  it('updates the table from the PATCH response without reloading the list', async () => {
    const list = vi.fn().mockReturnValue(of({ items: [pending], totalCount: 1 }));
    const decision = new Subject<ApiRequest>();
    const decide = vi.fn().mockReturnValue(decision);
    const openSnackBar = vi.fn();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), { provide: RequestsApiService, useValue: { list, decide } },
        { provide: MatSnackBar, useValue: { open: openSnackBar } }],
    }).compileComponents();
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const listCalls = list.mock.calls.length;
    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('button[aria-label="Aprobar solicitud 67"]')?.click();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(pending.title);
    decision.next({ ...pending, status: 'approved', version: 2 });
    decision.complete();
    await fixture.whenStable();
    expect(list).toHaveBeenCalledTimes(listCalls);
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain(pending.title);
    expect(openSnackBar).toHaveBeenCalledWith('Solicitud aprobada.', 'Cerrar',
      expect.objectContaining({ duration: 4000 }));
  });

  it('shows a conflict dialog and applies the current server status', async () => {
    const list = vi.fn().mockReturnValue(of({ items: [pending], totalCount: 1 }));
    const decision = new Subject<ApiRequest>();
    const decide = vi.fn().mockReturnValue(decision);
    const open = vi.fn();
    const openSnackBar = vi.fn();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), { provide: RequestsApiService, useValue: { list, decide } },
        { provide: MatDialog, useValue: { open } },
        { provide: MatSnackBar, useValue: { open: openSnackBar } }],
    }).compileComponents();
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const listCalls = list.mock.calls.length;
    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('button[aria-label="Aprobar solicitud 67"]')?.click();
    const current: ApiRequest = { ...pending, status: 'rejected', version: 2, decidedBy: 3,
      decidedAt: '2026-10-04T03:19:05.000Z', decisionComment: 'Sin presupuesto este trimestre' };
    decision.error(new HttpErrorResponse({ status: 409,
      error: { message: 'La solicitud fue modificada por otra persona', code: 'VERSION_CONFLICT', current } }));
    await fixture.whenStable();
    expect(open).toHaveBeenCalledWith(ConflictDialogComponent,
      expect.objectContaining({ data: expect.objectContaining({ current }) }));
    expect(list).toHaveBeenCalledTimes(listCalls);
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain(pending.title);
    expect(openSnackBar).not.toHaveBeenCalled();
  });

  it('shows a rejection snack bar after a successful decision', async () => {
    const list = vi.fn().mockReturnValue(of({ items: [pending], totalCount: 1 }));
    const decide = vi.fn().mockReturnValue(of({ ...pending, status: 'rejected', version: 2 }));
    const openSnackBar = vi.fn();
    vi.spyOn(window, 'prompt').mockReturnValue('Sin presupuesto');
    try {
      await TestBed.configureTestingModule({
        imports: [App],
        providers: [provideRouter([]), { provide: RequestsApiService, useValue: { list, decide } },
          { provide: MatSnackBar, useValue: { open: openSnackBar } }],
      }).compileComponents();
      const fixture = TestBed.createComponent(App);
      await fixture.whenStable();
      (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('button[aria-label="Rechazar solicitud 67"]')?.click();
      await fixture.whenStable();
      expect(decide).toHaveBeenCalledWith(67,
        { status: 'rejected', version: 1, decisionComment: 'Sin presupuesto' });
      expect(openSnackBar).toHaveBeenCalledWith('Solicitud rechazada.', 'Cerrar',
        expect.objectContaining({ duration: 4000 }));
    } finally {
      vi.restoreAllMocks();
    }
  });
});
