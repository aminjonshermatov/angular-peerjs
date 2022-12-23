import {Inject} from '@angular/core';
import {Component} from '@angular/core';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';

@Component({
  selector: 'app-call-info-dialog',
  templateUrl: './callinfo-dialog.component.html',
  styleUrls: ['./callinfo-dialog.component.scss']
})
export class CallInfoDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<CallInfoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private snackBar: MatSnackBar
  ) {
  }

  public showCopiedSnackBar() {
    this.snackBar.open('Peer ID Copied!', 'Hurrah', {
      duration: 1000,
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }
}

export interface DialogData {
  peerId?: string;
  joinCall: boolean;
}
