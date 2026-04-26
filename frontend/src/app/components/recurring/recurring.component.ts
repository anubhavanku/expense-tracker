import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RecurringService, RecurringTransaction }
  from '../../services/recurring.service';
import { AuthService } from '../../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent }
  from '../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-recurring',
  templateUrl: './recurring.component.html',
  styleUrls: ['./recurring.component.scss']
})
export class RecurringComponent implements OnInit {
  recurring: RecurringTransaction[] = [];
  showForm = false;
  isLoading = true;
  selectedRecurring: RecurringTransaction | null = null;
  recurringForm: FormGroup;

  categories = ['Food', 'Transport', 'Shopping',
    'Entertainment', 'Health', 'Bills',
    'Salary', 'Freelance', 'Investment', 'Other'];

  frequencies = [
    { value: 'DAILY', label: '📅 Daily' },
    { value: 'WEEKLY', label: '📅 Weekly' },
    { value: 'MONTHLY', label: '📅 Monthly' },
    { value: 'YEARLY', label: '📅 Yearly' }
  ];

  displayedColumns = [
    'title', 'type', 'amount',
    'category', 'frequency',
    'nextDueDate', 'status', 'actions'
  ];

  constructor(
    private fb: FormBuilder,
    private recurringService: RecurringService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.recurringForm = this.fb.group({
      type: ['EXPENSE', Validators.required],
      title: ['', Validators.required],
      description: [''],
      amount: ['', [Validators.required, Validators.min(1)]],
      category: ['', Validators.required],
      frequency: ['MONTHLY', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['']
    });
  }

  ngOnInit(): void { this.loadRecurring(); }

  loadRecurring(): void {
    const user = this.authService.getCurrentUser();
    if (!user) return;
    this.isLoading = true;
    this.recurringService.getAll(user.id).subscribe(data => {
      this.recurring = data;
      this.isLoading = false;
    });
  }

  get isIncome(): boolean {
    return this.recurringForm.get('type')?.value === 'INCOME';
  }

  onSubmit(): void {
    if (this.recurringForm.valid) {
      const user = this.authService.getCurrentUser();
      if (!user) return;

      const formValue = this.recurringForm.value;
      const data: Partial<RecurringTransaction> = {
        ...formValue,
        startDate: new Date(formValue.startDate)
          .toISOString().split('T')[0],
        endDate: formValue.endDate
          ? new Date(formValue.endDate)
            .toISOString().split('T')[0]
          : undefined,
        userId: user.id,
        // Preserve active status when editing
        active: this.selectedRecurring
          ? this.selectedRecurring.active
          : true
      };

      if (this.selectedRecurring?.id) {
        this.recurringService.update(
          this.selectedRecurring.id, data).subscribe({
            next: () => {
              this.snackBar.open('Updated!', 'Close',
                {
                  duration: 2000,
                  panelClass: ['success-snackbar']
                });
              this.resetForm();
              this.loadRecurring();
            }
          });
      } else {
        this.recurringService.create(user.id, data).subscribe({
          next: () => {
            this.snackBar.open('Recurring transaction created!',
              'Close', {
              duration: 2000,
              panelClass: ['success-snackbar']
            });
            this.resetForm();
            this.loadRecurring();
          }
        });
      }
    }
  }

  editRecurring(r: RecurringTransaction): void {
    this.selectedRecurring = r;
    this.showForm = true;
    this.recurringForm.patchValue({
      ...r,
      startDate: r.startDate
        ? new Date(r.startDate + 'T00:00:00') : null,
      endDate: r.endDate
        ? new Date(r.endDate + 'T00:00:00') : null
    });
  }

  toggleActive(r: RecurringTransaction): void {
    this.recurringService.toggle(r.id!).subscribe({
      next: () => {
        this.snackBar.open(
          r.active ? 'Paused' : 'Activated',
          'Close', { duration: 2000 });
        this.loadRecurring();
      }
    });
  }

  deleteRecurring(id: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '380px',
      data: {
        title: 'Delete Recurring Transaction',
        message: 'This will stop future automatic transactions. Are you sure?',
        confirmText: 'Delete',
        confirmColor: 'warn'
      }
    });
    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.recurringService.delete(id).subscribe({
          next: () => {
            this.snackBar.open('Deleted!', 'Close',
              { duration: 2000 });
            this.loadRecurring();
          }
        });
      }
    });
  }

  isOverdue(r: RecurringTransaction): boolean {
    if (!r.active || !r.nextDueDate) return false;
    return new Date(r.nextDueDate + 'T00:00:00') < new Date();
  }

  manualProcess(): void {
    this.recurringService.manualProcess().subscribe({
      next: () => {
        this.snackBar.open(
          'Processing complete! Check transactions.',
          'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.loadRecurring();
      }
    });
  }

  resetForm(): void {
    this.showForm = false;
    this.selectedRecurring = null;
    this.recurringForm.reset({ type: 'EXPENSE', frequency: 'MONTHLY' });
  }

  getFrequencyLabel(freq: string): string {
    const map: { [k: string]: string } = {
      DAILY: '📅 Daily',
      WEEKLY: '📅 Weekly',
      MONTHLY: '📅 Monthly',
      YEARLY: '📅 Yearly'
    };
    return map[freq] || freq;
  }

  getActiveCount(): number {
    return this.recurring.filter(r => r.active).length;
  }

  getTotalMonthlyExpense(): number {
    return this.recurring
      .filter(r => r.active && r.type === 'EXPENSE')
      .reduce((sum, r) => {
        const amount = Number(r.amount);
        switch (r.frequency) {
          case 'DAILY': return sum + (amount * 30);
          case 'WEEKLY': return sum + (amount * 4);
          case 'MONTHLY': return sum + amount;
          case 'YEARLY': return sum + (amount / 12);
          default: return sum;
        }
      }, 0);
  }

  getTotalMonthlyIncome(): number {
    return this.recurring
      .filter(r => r.active && r.type === 'INCOME')
      .reduce((sum, r) => {
        const amount = Number(r.amount);
        switch (r.frequency) {
          case 'DAILY': return sum + (amount * 30);
          case 'WEEKLY': return sum + (amount * 4);
          case 'MONTHLY': return sum + amount;
          case 'YEARLY': return sum + (amount / 12);
          default: return sum;
        }
      }, 0);
  }

  getNetMonthlyImpact(): number {
    return this.getTotalMonthlyIncome() - this.getTotalMonthlyExpense();
  }
}