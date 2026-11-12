import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { DataTableComponent, RequestColumn, RequestListStore, RequestStatus, RequestType } from 'shared';

@Component({
  selector: 'app-requests',
  imports: [DataTableComponent, MatFormFieldModule, MatInputModule, MatOptionModule, MatSelectModule, MatPaginatorModule],
  providers: [RequestListStore],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly list = inject(RequestListStore);
  protected readonly columns: RequestColumn[] = ['id', 'title', 'type', 'requesterName', 'createdAt', 'status'];

  constructor() { this.list.start(); }

  protected onSearch(event: Event): void { this.list.setSearch((event.target as HTMLInputElement).value); }
  protected onStatus(value: RequestStatus | ''): void { this.list.setStatus(value); }
  protected onType(value: RequestType | ''): void { this.list.setType(value); }
  protected onPage(event: PageEvent): void { this.list.setPage(event.pageIndex, event.pageSize); }
}

@Component({ selector: 'app-root', imports: [RouterOutlet], template: '<router-outlet />' })
export class Root {}
