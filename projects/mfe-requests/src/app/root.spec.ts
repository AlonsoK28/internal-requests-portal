import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { routes } from './app.routes';
import { Root } from './app';

describe('requests standalone root', () => {
  it('renders the public landing page without a session', async () => {
    sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Root],
      providers: [provideRouter(routes)],
    }).compileComponents();
    const fixture = TestBed.createComponent(Root);
    fixture.detectChanges();
    await TestBed.inject(Router).navigateByUrl('/');
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Inicia sesión en el portal para consultar tus solicitudes.');
  });
});
