import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

// ng material
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatSlideToggle } from '@angular/material/slide-toggle';


@Component({
  imports: [
    RouterOutlet,
    MatCardModule,
    MatChipsModule,
    MatSlideToggle
  ],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('mfe-requests');
}
