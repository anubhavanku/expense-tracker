import { Component, OnInit, ViewChild } from '@angular/core';
import { ExpenseService, Expense, PageResponse }
  from '../../services/expense.service';
import { AuthService } from '../../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ConfirmDialogComponent }
  from '../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-expense-list',
  templateUrl: './expense-list.component.html',
  styleUrls: ['./expense-list.component.scss']
})
export class ExpenseListComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  expenses: Expense[] = [];
  displayedColumns = ['date', 'title', 'type', 'category', 'amount', 'actions'];
  selectedExpense: Expense | null = null;
  showForm = false;
  filterForm: FormGroup;
  isLoading = false;

  // Pagination state
  totalElements = 0;
  pageSize = 10;
  pageIndex = 0;
  pageSizeOptions = [5, 10, 25, 50];

  // Sort state
  sortBy = 'expenseDate';
  sortDir = 'desc';

  // Filter state
  categories = ['All', 'Food', 'Transport', 'Shopping',
    'Entertainment', 'Health', 'Bills',
    'Salary', 'Freelance', 'Investment', 'Other'];
  types = ['ALL', 'EXPENSE', 'INCOME'];

  // Summary
  totalIncome = 0;
  totalExpenseAmount = 0;

  constructor(
    private expenseService: ExpenseService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      category: ['All'],
      type: ['ALL'],
      startDate: [''],
      endDate: ['']
    });
  }

  ngOnInit(): void { this.loadExpenses(); }

  loadExpenses(): void {
    const user = this.authService.getCurrentUser();
    if (!user) return;
    this.isLoading = true;

    const { category, type, startDate, endDate } = this.filterForm.value;
    const start = startDate
      ? new Date(startDate).toISOString().split('T')[0] : undefined;
    const end = endDate
      ? new Date(endDate).toISOString().split('T')[0] : undefined;

    this.expenseService.getPagedExpenses(
      user.id, this.pageIndex, this.pageSize,
      this.sortBy, this.sortDir,
      category, type, start, end
    ).subscribe((data: PageResponse<Expense>) => {
      this.expenses = data.content;
      this.totalElements = data.totalElements;
      this.totalIncome = data.totalIncome;
      this.totalExpenseAmount = data.totalExpense;
      this.isLoading = false;
    });
  }


  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadExpenses();
  }

  onSortChange(event: Sort): void {
    this.sortBy = event.active || 'expenseDate';
    this.sortDir = event.direction || 'desc';
    this.pageIndex = 0;
    this.loadExpenses();
  }

  applyFilters(): void {
    this.pageIndex = 0;
    this.loadExpenses();
  }

  clearFilters(): void {
    this.filterForm.reset({
      category: 'All', type: 'ALL',
      startDate: '', endDate: ''
    });
    this.pageIndex = 0;
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
        title: 'Delete Transaction',
        message: 'Are you sure you want to delete this transaction? This action cannot be undone.',
        confirmText: 'Delete',
        confirmColor: 'warn'
      }
    });
    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.expenseService.deleteExpense(id).subscribe({
          next: () => {
            this.snackBar.open('Transaction deleted!',
              'Close', { duration: 2000 });
            this.loadExpenses();
          }
        });
      }
    });
  }

  onExpenseSaved(): void {
    this.showForm = false;
    this.selectedExpense = null;
    this.pageIndex = 0;
    this.loadExpenses();
  }

  getTotalIncome(): number { return this.totalIncome; }
  getTotalExpenses(): number { return this.totalExpenseAmount; }
}