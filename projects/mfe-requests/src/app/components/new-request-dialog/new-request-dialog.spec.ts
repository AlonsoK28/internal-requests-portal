import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { MatDialogRef } from '@angular/material/dialog';
import { Subject, of, throwError } from 'rxjs';
import { RequestsApiService } from 'shared';
import { NewRequestDialog, advanceNotice, dateOrder, validDate } from './new-request-dialog';
import { FormControl, FormGroup } from '@angular/forms';

const catalog = [{ id: 'equipment' as const, name: 'Equipo', description: 'Equipo', amount: 3000,
  requiredFields: ['model', 'amount'] }];

describe('NewRequestDialog', () => {
  const create = vi.fn();
  const close = vi.fn();
  beforeEach(() => {
    create.mockReset(); close.mockReset();
    TestBed.configureTestingModule({
      providers: [
        { provide: RequestsApiService, useValue: { types: () => of(catalog), create } },
        { provide: MatDialogRef, useValue: { close } },
      ],
    });
  });

  it('requires dynamic fields and enforces the catalog amount limit', () => {
    const dialog = TestBed.runInInjectionContext(() => new NewRequestDialog());
    dialog.selectType('equipment');
    expect(dialog.form.controls.model.invalid).toBe(true);
    dialog.form.controls.amount.setValue(3001);
    expect(dialog.form.controls.amount.hasError('max')).toBe(true);
    expect(dateOrder(new FormGroup({ startDate: new FormControl('2026-12-10'),
      endDate: new FormControl('2026-12-09') }))).toEqual({ dateOrder: true });
  });

  it('validates trimmed title and travel dates', () => {
    const dialog = TestBed.runInInjectionContext(() => new NewRequestDialog());
    dialog.form.controls.title.setValue('  abc  ');
    expect(dialog.form.controls.title.hasError('minlength')).toBe(true);
    dialog.form.controls.title.setValue(`  ${'x'.repeat(81)}  `);
    expect(dialog.form.controls.title.hasError('maxlength')).toBe(true);
    expect(validDate(new FormControl('2026-02-30'))).toEqual({ date: true });
    expect(advanceNotice(new FormControl('2020-01-01'))).toEqual({ advanceNotice: true });
  });

  it('requires a 20-character access justification', () => {
    const dialog = TestBed.runInInjectionContext(() => new NewRequestDialog());
    dialog.catalog.set([{ id: 'access', name: 'Acceso', description: 'Acceso', amount: 0,
      requiredFields: ['system', 'justification'] }]);
    dialog.selectType('access');
    dialog.form.controls.justification.setValue('  muy corta  ');
    expect(dialog.form.controls.justification.hasError('minlength')).toBe(true);
  });

  it('keeps entered data and shows field errors on 422', () => {
    create.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 422,
      error: { message: 'Inválido', errors: { model: ['Modelo no permitido'] } } })));
    const dialog = TestBed.runInInjectionContext(() => new NewRequestDialog());
    dialog.selectType('equipment');
    dialog.form.patchValue({ title: 'Laptop', model: 'X1', amount: 1000 });
    dialog.submit();
    expect(dialog.error('model')).toBe('Modelo no permitido');
    expect(dialog.form.controls.model.value).toBe('X1');
  });

  it('prevents duplicate submissions and closes after creation', () => {
    const pending = new Subject<never>();
    create.mockReturnValue(pending);
    const dialog = TestBed.runInInjectionContext(() => new NewRequestDialog());
    dialog.selectType('equipment');
    dialog.form.patchValue({ title: 'Laptop', model: 'X1', amount: 1000 });
    dialog.submit(); dialog.submit();
    expect(create).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith({ type: 'equipment', title: 'Laptop', amount: 1000,
      details: { model: 'X1' } });
    pending.next(undefined as never);
    expect(close).toHaveBeenCalledWith(true);
  });
});
