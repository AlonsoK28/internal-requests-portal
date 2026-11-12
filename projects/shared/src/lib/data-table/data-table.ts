import { DatePipe } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { ApiRequest } from '../api/api.models';

export type RequestColumn = 'id' | 'type' | 'requesterName' | 'createdAt' | 'status' | 'actions';
export type TableAction = { kind: 'approve' | 'reject'; request: ApiRequest };

@Component({
  selector: 'lib-data-table',
  imports: [DatePipe, MatButtonModule, MatProgressSpinnerModule, MatTableModule],
  templateUrl: './data-table.html',
  styleUrl: './data-table.scss',
})
export class DataTableComponent {
  readonly data = input.required<readonly ApiRequest[]>();
  readonly columns = input.required<readonly RequestColumn[]>();
  readonly loading = input(false);
  readonly error = input(false);
  readonly action = output<TableAction>();
  readonly retry = output<void>();
  protected readonly displayedColumns = computed(() => [...this.columns()]);
}
