import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ExpenseService } from '../../services/expense.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  passwordForm: FormGroup;
  totalExpenses = 0;
  expenseCount = 0;
  topCategory = '-';
  activeTab = 0;

  constructor(
    private fb: FormBuilder,
    public authService: AuthService,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private expenseService: ExpenseService
  ) {
    this.profileForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]]
    });
    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.profileForm.patchValue({ username: user.username, email: user.email });
      this.expenseService.getTotalExpenses(user.id).subscribe(t => this.totalExpenses = t || 0);
      this.expenseService.getExpensesByUser(user.id).subscribe(e => this.expenseCount = e.length);
      this.expenseService.getSummaryByCategory(user.id).subscribe(data => {
        if (data.length > 0) this.topCategory = data.reduce((a, b) => a[1] > b[1] ? a : b)[0];
      });
    }
  }

  saveProfile(): void {
    if (this.profileForm.valid) {
      const user = this.authService.getCurrentUser();
      if (!user) return;
      // this.http.put(`http://localhost:8080/api/users/${user.id}`, this.profileForm.value)
        this.http.put(`http://localhost:8080/api/auth/users/${user.id}`, this.profileForm.value)
        .subscribe({
          next: (updated: any) => {
            const newUser = { ...user, ...this.profileForm.value };
            localStorage.setItem('currentUser', JSON.stringify(newUser));
            this.snackBar.open('Profile updated!', 'Close', { duration: 2000 });
          },
          error: () => this.snackBar.open('Failed to update profile', 'Close', { duration: 2000 })
        });
    }
  }

  changePassword(): void {
    const { newPassword, confirmPassword } = this.passwordForm.value;
    if (newPassword !== confirmPassword) {
      this.snackBar.open('Passwords do not match!', 'Close', { duration: 2000 });
      return;
    }
    if (this.passwordForm.valid) {
      const user = this.authService.getCurrentUser();
      if (!user) return;
      // this.http.put(`http://localhost:8080/api/users/${user.id}/password` 
      this.http.put(`http://localhost:8080/api/auth/users/${user.id}/password`, {
        newPassword
      }).subscribe({
        next: () => {
          this.snackBar.open('Password changed!', 'Close', { duration: 2000 });
          this.passwordForm.reset();
        },
        error: () => this.snackBar.open('Failed to change password', 'Close', { duration: 2000 })
      });
    }
  }

  getInitials(): string {
    const user = this.authService.getCurrentUser();
    if (!user) return '?';
    return user.username.substring(0, 2).toUpperCase();
  }
}