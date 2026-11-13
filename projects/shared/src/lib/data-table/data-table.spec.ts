import { TestBed } from '@angular/core/testing';
import { ApiRequest } from '../api/api.models';
import { DataTableComponent } from './data-table';

const request: ApiRequest = {
  id: 7, title: 'Computadora nueva', type: 'equipment', status: 'pending',
  requesterId: 3, requesterName: 'Ana', createdAt: '2026-11-12T12:00:00Z',
  updatedAt: '2026-11-12T13:00:00Z', version: 2, details: { model: 'ThinkPad' },
};

describe('DataTableComponent', () => {
  it('emits the selected request ID when detail navigation is enabled', async () => {
    await TestBed.configureTestingModule({ imports: [DataTableComponent] }).compileComponents();
    const fixture = TestBed.createComponent(DataTableComponent);
    fixture.componentRef.setInput('data', [request]);
    fixture.componentRef.setInput('columns', ['id', 'title']);
    fixture.componentRef.setInput('seeDetail', true);
    const selected: number[] = [];
    fixture.componentInstance.detail.subscribe(id => selected.push(id));
    await fixture.whenStable();
    const row = (fixture.nativeElement as HTMLElement).querySelector('tr.mat-mdc-row') as HTMLTableRowElement;
    expect(row.textContent).toContain('Computadora nueva');
    row.click();
    expect(selected).toEqual([7]);
    const button = row.querySelector('button.detail-button') as HTMLButtonElement;
    expect(button.textContent).toContain('Ver detalle');
    button.click();
    expect(selected).toEqual([7, 7]);
  });
});
