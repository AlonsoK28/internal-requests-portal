import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { RequestsApiService } from 'shared';
import { App } from './app';

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
});
