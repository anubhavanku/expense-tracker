import { Component, OnInit } from '@angular/core';
import { ExpenseService, Expense } from '../../services/expense.service';
import { AuthService } from '../../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-expense-list',
  templateUrl: './expense-list.component.html',
  styleUrls: ['./expense-list.component.scss']
})
export class ExpenseListComponent implements OnInit {
  expenses: Expense[] = [];
  displayedColumns = ['date', 'title', 'category', 'amount', 'actions'];
  selectedExpense: Expense | null = null;
  showForm = false;
  filterForm: FormGroup;
  categories = ['All', 'Food', 'Transport', 'Shopping', 'Entertainment', 'Health', 'Bills', 'Other'];

  constructor(
    private expenseService: ExpenseService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      category: ['All'],
      startDate: [''],
      endDate: ['']
    });
  }

  ngOnInit(): void { this.loadExpenses(); }

  loadExpenses(): void {
    const user = this.authService.getCurrentUser();
    if (!user) return;
    const { category, startDate, endDate } = this.filterForm.value;
    if (startDate && endDate) {
      const start = new Date(startDate).toISOString().split('T')[0];
      const end = new Date(endDate).toISOString().split('T')[0];
      this.expenseService.getExpensesByDateRange(user.id, start, end).subscribe(data => {
        this.expenses = category && category !== 'All' ? data.filter(e => e.category === category) : data;
      });
    } else if (category && category !== 'All') {
      this.expenseService.getExpensesByCategory(user.id, category).subscribe(data => {
        this.expenses = data;
      });
    } else {
      this.expenseService.getExpensesByUser(user.id).subscribe(data => {
        this.expenses = data;
      });
    }
  }

  applyFilters(): void { this.loadExpenses(); }

  clearFilters(): void {
    this.filterForm.reset({ category: 'All', startDate: '', endDate: '' });
    this.loadExpenses();
  }

  editExpense(expense: Expense): void {
    this.selectedExpense = expense;
    this.showForm = true;
  }

  deleteExpense(id: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '380px',
      data: {
        title: 'Delete Expense',
        message: 'Are you sure you want to delete this expense? This action cannot be undone.'
      }
    });
    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.expenseService.deleteExpense(id).subscribe({
          next: () => {
            this.snackBar.open('Expense deleted!', 'Close', { duration: 2000 });
            this.loadExpenses();
          }
        });
      }
    });
  }

  onExpenseSaved(): void {
    this.showForm = false;
    this.selectedExpense = null;
    this.loadExpenses();
  }

  getTotalAmount(): number {
    return this.expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  }
}