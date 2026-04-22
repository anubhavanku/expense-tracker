import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {
  @Input() isDarkMode = false;
  @Output() toggleDark = new EventEmitter<void>();

  constructor(
    public authService: AuthService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  logout(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '360px',
      data: {
        title: 'Confirm Logout',
        message: 'Are you sure you want to logout?',
        confirmText: 'Logout',
        confirmColor: 'primary'
      }
    });
    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.authService.logout();
      }
    });
  }
}