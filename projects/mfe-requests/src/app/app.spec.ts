import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { ApiRequest, RequestsApiService } from 'shared';
import { App } from './app';

@Component({ template: '' })
class DetailStub {}

describe('App', () => {
  it('loads the requests list', async () => {
    const list = vi.fn().mockReturnValue(of({ items: [], totalCount: 0 }));
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), { provide: RequestsApiService, useValue: { list } }],
    }).compileComponents();
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    expect(list).toHaveBeenCalledWith(expect.objectContaining({ _page: 1, _limit: 10 }));
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('No se encontraron solicitudes.');
  });

  it('navigates to the selected request detail', async () => {
    const request: ApiRequest = { id: 7, title: 'Computadora nueva', type: 'equipment',
      status: 'pending', requesterId: 3, requesterName: 'Ana', createdAt: '2026-11-12T12:00:00Z',
      updatedAt: '2026-11-12T13:00:00Z', version: 1, details: { model: 'ThinkPad' } };
    const list = vi.fn().mockReturnValue(of({ items: [request], totalCount: 1 }));
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([{ path: 'requests/:id', component: DetailStub }]),
        { provide: RequestsApiService, useValue: { list } }],
    }).compileComponents();
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    (fixture.nativeElement as HTMLElement).querySelector('tr.mat-mdc-row')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/requests/7');
  });
});
