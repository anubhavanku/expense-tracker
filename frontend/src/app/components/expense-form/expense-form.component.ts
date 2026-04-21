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
  categories = ['Food', 'Transport', 'Shopping', 'Entertainment', 'Health', 'Bills', 'Other'];

  constructor(
    private fb: FormBuilder,
    private expenseService: ExpenseService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.expenseForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      amount: ['', [Validators.required, Validators.min(0)]],
      category: ['', Validators.required],
      expenseDate: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    if (this.expenseToEdit) {
      this.expenseForm.patchValue(this.expenseToEdit);
    }
  }

  onSubmit(): void {
    if (this.expenseForm.valid) {
      const user = this.authService.getCurrentUser();
      if (!user) return;

      const expense: Expense = {
        ...this.expenseForm.value,
        expenseDate: new Date(this.expenseForm.value.expenseDate).toISOString().split('T')[0],
        userId: user.id
      };

      if (this.expenseToEdit?.id) {
        this.expenseService.updateExpense(this.expenseToEdit.id, expense).subscribe({
          next: () => {
            this.snackBar.open('Expense updated!', 'Close', { duration: 2000 });
            this.expenseSaved.emit();
          }
        });
      } else {
        this.expenseService.createExpense(expense).subscribe({
          next: () => {
            this.snackBar.open('Expense added!', 'Close', { duration: 2000 });
            this.expenseForm.reset();
            this.expenseSaved.emit();
          }
        });
      }
    }
  }
}