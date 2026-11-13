import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogActions, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CatalogType, CreateRequest, RequestsApiService, RequestType, ValidationError } from 'shared';

type Field = 'model' | 'system' | 'justification' | 'destination' | 'startDate' | 'endDate' | 'amount';

export function dateOrder(control: AbstractControl): ValidationErrors | null {
  const start = control.get('startDate')?.value as string | undefined;
  const end = control.get('endDate')?.value as string | undefined;
  return start && end && end < start ? { dateOrder: true } : null;
}

export function validDate(control: AbstractControl): ValidationErrors | null {
  const value: unknown = control.value;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return { date: true };
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? { date: true } : null;
}

export function advanceNotice(control: AbstractControl): ValidationErrors | null {
  if (validDate(control)) return null;
  const today = new Date();
  const minimum = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3);
  const value = control.value as string;
  const start = new Date(`${value}T00:00:00`);
  return start < minimum ? { advanceNotice: true } : null;
}

function trimmedLength(min: number, max?: number) {
  return (control: AbstractControl): ValidationErrors | null => {
    const length = typeof control.value === 'string' ? control.value.trim().length : 0;
    if (length < min) return { minlength: true };
    return max !== undefined && length > max ? { maxlength: true } : null;
  };
}

function requiredText(control: AbstractControl): ValidationErrors | null {
  return typeof control.value === 'string' && control.value.trim() ? null : { required: true };
}

@Component({
  selector: 'app-new-request-dialog',
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatDialogActions, MatDialogContent, MatDialogTitle],
  templateUrl: './new-request-dialog.html',
  styleUrl: './new-request-dialog.scss',
})
export class NewRequestDialog {
  private readonly api = inject(RequestsApiService);
  readonly dialog = inject(MatDialogRef<NewRequestDialog>);
  readonly catalog = signal<readonly CatalogType[]>([]);
  readonly loading = signal(true);
  readonly loadingError = signal(false);
  readonly sending = signal(false);
  readonly submitError = signal('');
  readonly serverErrors = signal<Record<string, string[]>>({});
  readonly selected = signal<CatalogType | undefined>(undefined);
  readonly form = new FormGroup({
    type: new FormControl<RequestType | ''>('', { nonNullable: true, validators: Validators.required }),
    title: new FormControl('', { nonNullable: true, validators: [requiredText, trimmedLength(5, 80)] }),
    model: new FormControl('', { nonNullable: true }),
    system: new FormControl('', { nonNullable: true }),
    justification: new FormControl('', { nonNullable: true }),
    destination: new FormControl('', { nonNullable: true }),
    startDate: new FormControl('', { nonNullable: true }),
    endDate: new FormControl('', { nonNullable: true }),
    amount: new FormControl<number | null>(null),
  }, { validators: dateOrder });

  constructor() { this.load(); }

  load(): void {
    this.loading.set(true);
    this.loadingError.set(false);
    this.api.types().subscribe({
      next: catalog => {
        this.catalog.set(catalog);
        const type = this.form.controls.type.value;
        if (type) this.selectType(type);
        this.loading.set(false);
      },
      error: () => { this.loadingError.set(true); this.loading.set(false); },
    });
  }

  selectType(type: RequestType): void {
    this.form.controls.type.setValue(type);
    this.serverErrors.set({});
    const selected = this.catalog().find(item => item.id === type);
    this.selected.set(selected);
    this.form.controls.type.setErrors(selected ? null : { catalog: true });
    const controls = this.form.controls;
    for (const field of ['model', 'system', 'justification', 'destination', 'startDate', 'endDate'] as const) {
      const required = selected?.requiredFields.includes(field);
      controls[field].setValidators(required
        ? field === 'justification' ? [requiredText, trimmedLength(20)]
          : field === 'startDate' ? [requiredText, validDate, advanceNotice]
          : field === 'endDate' ? [requiredText, validDate]
          : [requiredText]
        : null);
      controls[field].updateValueAndValidity();
    }
    controls.amount.setValidators(selected?.requiredFields.includes('amount')
      ? [Validators.required, Validators.min(0.01), Validators.max(selected.amount)] : null);
    controls.amount.updateValueAndValidity();
    this.form.updateValueAndValidity();
  }

  has(field: Field): boolean { return this.selected()?.requiredFields.includes(field) ?? false; }
  error(field: Field | 'title' | 'type'): string {
    const server = this.serverErrors()[field] ?? this.serverErrors()[`details.${field}`];
    const control = this.form.controls[field];
    if (control.hasError('server') && server?.length) return server.join(' ');
    if (!control.touched || !control.invalid) return '';
    if (control.hasError('required')) return 'Este campo es obligatorio.';
    if (control.hasError('catalog')) return 'Selecciona un tipo del catálogo.';
    if (control.hasError('minlength')) return field === 'title' ? 'El título debe tener al menos 5 caracteres.' : 'La justificación debe tener al menos 20 caracteres.';
    if (control.hasError('maxlength')) return 'El título no puede superar 80 caracteres.';
    if (control.hasError('date')) return 'Introduce una fecha válida con formato AAAA-MM-DD.';
    if (control.hasError('advanceNotice')) return 'La fecha de inicio debe tener al menos 3 días de anticipación.';
    if (control.hasError('min')) return 'El monto debe ser mayor que cero.';
    if (control.hasError('max')) return `El monto máximo es ${this.selected()?.amount}.`;
    return 'Valor inválido.';
  }

  submit(): void {
    if (this.sending() || this.loading() || this.loadingError()) return;
    this.form.markAllAsTouched();
    const type = this.form.controls.type.value;
    if (!type || !this.catalog().some(item => item.id === type)) {
      this.form.controls.type.setErrors({ catalog: true });
    }
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    let payload: CreateRequest;
    switch (v.type) {
      case 'equipment': payload = { type: 'equipment', title: v.title.trim(), amount: v.amount!, details: { model: v.model.trim() } }; break;
      case 'access': payload = { type: 'access', title: v.title.trim(), details: { system: v.system.trim(), justification: v.justification.trim() } }; break;
      case 'travel': payload = { type: 'travel', title: v.title.trim(), amount: v.amount!, details: { destination: v.destination.trim(), startDate: v.startDate, endDate: v.endDate } }; break;
      default: return;
    }
    this.sending.set(true);
    this.submitError.set('');
    this.serverErrors.set({});
    this.api.create(payload).subscribe({
      next: () => { this.sending.set(false); this.dialog.close(true); },
      error: (error: unknown) => {
        this.sending.set(false);
        if (error instanceof HttpErrorResponse && error.status === 422) {
          const body = error.error as Partial<ValidationError> | null;
          const errors = body?.errors && typeof body.errors === 'object' ? body.errors : {};
          this.serverErrors.set(errors);
          for (const [key, messages] of Object.entries(errors)) {
            const field = key.replace(/^details\./, '') as keyof typeof this.form.controls;
            if (field in this.form.controls && Array.isArray(messages) && messages.length) {
              this.form.controls[field].setErrors({ server: true });
              this.form.controls[field].markAsTouched();
            }
          }
          this.submitError.set(body?.message ?? 'Revisa los campos marcados.');
        } else this.submitError.set('No se pudo crear la solicitud. Inténtalo de nuevo.');
      },
    });
  }
}
