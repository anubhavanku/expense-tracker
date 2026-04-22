import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BudgetService, Budget } from '../../services/budget.service';
import { AuthService } from '../../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-budget',
  templateUrl: './budget.component.html',
  styleUrls: ['./budget.component.scss']
})
export class BudgetComponent implements OnInit {
  budgets: Budget[] = [];
  budgetForm: FormGroup;
  showForm = false;
  currentMonth = new Date().getMonth() + 1;
  currentYear = new Date().getFullYear();
  categories = ['Food', 'Transport', 'Shopping',
    'Entertainment', 'Health', 'Bills', 'Other'];

  constructor(
    private fb: FormBuilder,
    private budgetService: BudgetService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.budgetForm = this.fb.group({
      category: ['', Validators.required],
      limitAmount: ['', [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit(): void { this.loadBudgets(); }

  loadBudgets(): void {
    const user = this.authService.getCurrentUser();
    if (!user) return;
    this.budgetService.getBudgets(
        user.id, this.currentMonth, this.currentYear)
      .subscribe(data => this.budgets = data);
  }

  onSubmit(): void {
    if (this.budgetForm.valid) {
      const user = this.authService.getCurrentUser();
      if (!user) return;
      const budget = {
        ...this.budgetForm.value,
        month: this.currentMonth,
        year: this.currentYear
      };
      this.budgetService.setBudget(user.id, budget).subscribe({
        next: () => {
          this.snackBar.open('Budget set!', 'Close',
            { duration: 2000, panelClass: ['success-snackbar'] });
          this.budgetForm.reset();
          this.showForm = false;
          this.loadBudgets();
        }
      });
    }
  }

  deleteBudget(id: number): void {
    this.budgetService.deleteBudget(id).subscribe({
      next: () => {
        this.snackBar.open('Budget removed', 'Close', { duration: 2000 });
        this.loadBudgets();
      }
    });
  }

  getStatusColor(status: string): string {
    switch(status) {
      case 'EXCEEDED': return '#c62828';
      case 'DANGER': return '#e53935';
      case 'WARNING': return '#fb8c00';
      default: return '#2e7d32';
    }
  }

  getProgressColor(status: string): string {
    switch(status) {
      case 'EXCEEDED':
      case 'DANGER': return 'warn';
      case 'WARNING': return 'accent';
      default: return 'primary';
    }
  }

  getStatusLabel(status: string): string {
    switch(status) {
      case 'EXCEEDED': return '🚨 Exceeded';
      case 'DANGER': return '⚠️ Critical';
      case 'WARNING': return '🔔 Warning';
      default: return '✅ On Track';
    }
  }

  getMonthName(): string {
    return new Date(this.currentYear, this.currentMonth - 1)
      .toLocaleString('default', { month: 'long', year: 'numeric' });
  }
}