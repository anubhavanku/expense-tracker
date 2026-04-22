import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ExpenseService, Expense } from '../../services/expense.service';
import { AuthService } from '../../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-expense-form',
  templateUrl: './expense-form.component.html',
  styleUrls: ['./expense-form.component.scss']
})
export class ExpenseFormComponent implements OnInit {
  @Input() expenseToEdit: Expense | null = null;
  @Output() expenseSaved = new EventEmitter<void>();

  expenseForm: FormGroup;
  categories = ['Food', 'Transport', 'Shopping',
    'Entertainment', 'Health', 'Bills', 'Salary',
    'Freelance', 'Investment', 'Other'];

  constructor(
    private fb: FormBuilder,
    private expenseService: ExpenseService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.expenseForm = this.fb.group({
      type: ['EXPENSE', Validators.required],
      title: ['', Validators.required],
      description: [''],
      amount: ['', [Validators.required, Validators.min(0)]],
      category: ['', Validators.required],
      expenseDate: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    if (this.expenseToEdit) {
      this.expenseForm.patchValue({
        ...this.expenseToEdit,
        type: this.expenseToEdit.type || 'EXPENSE',
        expenseDate: this.expenseToEdit.expenseDate
          ? new Date(this.expenseToEdit.expenseDate + 'T00:00:00')
          : null
      });
    }
  }

  get isIncome(): boolean {
    return this.expenseForm.get('type')?.value === 'INCOME';
  }

  onSubmit(): void {
    if (this.expenseForm.valid) {
      const user = this.authService.getCurrentUser();
      if (!user) return;

      const rawDate = this.expenseForm.value.expenseDate;
      let formattedDate: string;

      if (rawDate instanceof Date) {
        // Fix timezone offset — use local date not UTC
        const year = rawDate.getFullYear();
        const month = String(rawDate.getMonth() + 1).padStart(2, '0');
        const day = String(rawDate.getDate()).padStart(2, '0');
        formattedDate = `${year}-${month}-${day}`;
      } else {
        formattedDate = rawDate;
      }

      const expense: Expense = {
        ...this.expenseForm.value,
        expenseDate: formattedDate,
        userId: user.id
      };

      if (this.expenseToEdit?.id) {
        this.expenseService.updateExpense(
          this.expenseToEdit.id, expense).subscribe({
            next: () => {
              this.snackBar.open('Updated successfully!',
                'Close', {
                  duration: 2000,
                panelClass: ['success-snackbar']
              });
              this.expenseSaved.emit();
            }
          });
      } else {
        this.expenseService.createExpense(expense).subscribe({
          next: () => {
            this.snackBar.open(
              `${this.isIncome ? 'Income' : 'Expense'} added!`,
              'Close', {
                duration: 2000,
              panelClass: ['success-snackbar']
            });
            this.expenseForm.reset({ type: 'EXPENSE' });
            this.expenseSaved.emit();
          }
        });
      }
    }
  }
}