import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { VersionConflictError } from '../api/api.models';

@Component({
  selector: 'lib-conflict-dialog',
  imports: [DatePipe, MatButtonModule, MatDialogModule],
  templateUrl: './conflict-dialog.html',
  styleUrl: './conflict-dialog.scss',
})
export class ConflictDialogComponent {
  protected readonly conflict = inject<VersionConflictError>(MAT_DIALOG_DATA);
}
