import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

// ng material
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  imports: [
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule
  ],
  selector: 'app-approvals',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('mfe-approvals');
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class Root {}
