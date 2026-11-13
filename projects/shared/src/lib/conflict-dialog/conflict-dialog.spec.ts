import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { VersionConflictError } from '../api/api.models';
import { ConflictDialogComponent } from './conflict-dialog';

describe('ConflictDialogComponent', () => {
  it('shows the current resolution details', async () => {
    const data: VersionConflictError = {
      code: 'VERSION_CONFLICT', message: 'La solicitud fue modificada por otra persona',
      current: { id: 67, title: 'Carpeta compartida de Finanzas', type: 'access', status: 'rejected',
        requesterId: 2, requesterName: 'Bruno Díaz', createdAt: '2026-10-01T03:19:05.000Z',
        updatedAt: '2026-10-04T03:19:05.000Z', version: 2, decidedBy: 3,
        decidedAt: '2026-10-04T03:19:05.000Z', decisionComment: 'Sin presupuesto este trimestre',
        details: { system: 'SharePoint', justification: 'Necesario para las tareas del puesto' } },
    };
    await TestBed.configureTestingModule({
      imports: [ConflictDialogComponent],
      providers: [{ provide: MAT_DIALOG_DATA, useValue: data }, { provide: MatDialogRef, useValue: {} }],
    }).compileComponents();
    const fixture = TestBed.createComponent(ConflictDialogComponent);
    await fixture.whenStable();
    const content = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(content).toContain('La solicitud fue modificada por otra persona');
    expect(content).toContain('Carpeta compartida de Finanzas');
    expect(content).toContain('Usuario ID 3');
    expect(content).toContain('Sin presupuesto este trimestre');
  });
});
