import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

// ng material
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatSlideToggle } from '@angular/material/slide-toggle';


@Component({
  imports: [
    MatCardModule,
    MatChipsModule,
    MatSlideToggle
  ],
  selector: 'app-requests',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('mfe-requests');
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class Root {}
