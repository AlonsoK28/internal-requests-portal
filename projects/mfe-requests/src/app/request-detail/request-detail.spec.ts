import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, Subject } from 'rxjs';
import { ApiRequest, RequestsApiService } from 'shared';
import { RequestDetailComponent } from './request-detail';

const equipment: ApiRequest = {
  id: 7, title: 'Computadora nueva', type: 'equipment', status: 'pending',
  requesterId: 3, requesterName: 'Ana', createdAt: '2026-11-12T12:00:00Z',
  updatedAt: '2026-11-12T13:00:00Z', version: 2, amount: 1200,
  details: { model: 'ThinkPad' },
};

describe('RequestDetailComponent', () => {
  const get = vi.fn();

  beforeEach(async () => {
    get.mockReset();
    await TestBed.configureTestingModule({
      imports: [RequestDetailComponent],
      providers: [provideRouter([]),
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ id: '7' })) } },
        { provide: RequestsApiService, useValue: { get } }],
    }).compileComponents();
  });

  it('loads and displays equipment details', async () => {
    get.mockReturnValue(of(equipment));
    const fixture = TestBed.createComponent(RequestDetailComponent);
    await fixture.whenStable();
    const content = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(get).toHaveBeenCalledWith(7);
    expect(content).toContain('Computadora nueva');
    expect(content).toContain('ThinkPad');
    expect(content).toContain('Ana');
    expect((fixture.nativeElement as HTMLElement).querySelector('a[href="/requests"]')).not.toBeNull();
  });

  it('shows an HTTP 500 error and retries', async () => {
    const first = new Subject<ApiRequest>();
    get.mockReturnValueOnce(first).mockReturnValueOnce(of(equipment));
    const fixture = TestBed.createComponent(RequestDetailComponent);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Cargando solicitud');
    first.error(new HttpErrorResponse({ status: 500 }));
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('error del servidor');
    (fixture.nativeElement as HTMLElement).querySelector('button')?.click();
    await fixture.whenStable();
    expect(get).toHaveBeenCalledTimes(2);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('ThinkPad');
  });
});
