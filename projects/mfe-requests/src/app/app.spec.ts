import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { RequestsApiService } from 'shared';
import { App } from './app';

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
});
