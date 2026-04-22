import { Component, OnInit } from '@angular/core';
import { ChartData, ChartType, ChartOptions } from 'chart.js';
import { ExpenseService, Expense } from '../../services/expense.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  totalIncome = 0;
  netSavings = 0;

  currentMonth = new Date().getMonth() + 1;
  currentYear = new Date().getFullYear();
  currentMonthSpent = 0;
  currentMonthIncome = 0;

  // Income vs Expense Bar Chart
  incomeExpenseType: ChartType = 'bar';
  incomeExpenseData: ChartData<'bar'> = { labels: [], datasets: [] };
  incomeExpenseOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'top' } },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { callback: v => '₹' + v }
      }
    }
  };
  totalExpenses = 0;
  expenseCount = 0;
  highestCategory = '-';
  recentExpenses: Expense[] = [];
  budgetLimit = 1000;
  budgetInput = 1000;
  budgetUsedPercent = 0;
  budgetStatus: 'safe' | 'warning' | 'danger' = 'safe';

  // Pie Chart
  pieChartType: ChartType = 'pie';
  pieChartData: ChartData<'pie'> = { labels: [], datasets: [{ data: [] }] };
  pieChartOptions: ChartOptions = {
    responsive: true,
    plugins: { legend: { position: 'bottom' } }
  };

  // Monthly Bar Chart
  barChartType: ChartType = 'bar';
  monthlyChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  monthlyChartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { callback: (v) => '₹' + v }
      }
    }
  };

  // Daily Line Chart
  dailyChartType: ChartType = 'line';
  dailyChartData: ChartData<'line'> = { labels: [], datasets: [] };
  dailyChartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { callback: (v) => '₹' + v },
        grid: { color: '#f0f0f0' }
      },
      x: {
        grid: { display: false }
      }
    },
    elements: {
      point: { radius: 4, hoverRadius: 6, backgroundColor: '#00897b' },
      line: { tension: 0.4 }
    }
  };

  private allExpenses: Expense[] = [];

  constructor(
    private expenseService: ExpenseService,
    private authService: AuthService
  ) {
    const saved = localStorage.getItem('budgetLimit');
    if (saved) {
      this.budgetLimit = +saved;
      this.budgetInput = +saved;
    }
  }

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    const now = new Date();
    this.currentMonth = now.getMonth() + 1;
    this.currentYear = now.getFullYear();

    // All-time totals
    this.expenseService.getTotalExpenses(user.id).subscribe(total => {
      this.totalExpenses = total || 0;
    });

    this.expenseService.getTotalIncome(user.id).subscribe(income => {
      this.totalIncome = income || 0;
      this.netSavings = this.totalIncome - this.totalExpenses;
      this.buildIncomeExpenseChart();
    });

    // All transactions — for counts and charts
    this.expenseService.getExpensesByUser(user.id).subscribe(all => {
      this.expenseCount = all.length;
      const expensesOnly = all.filter(e => e.type === 'EXPENSE');
      this.recentExpenses = expensesOnly.slice(-5).reverse();
      this.buildMonthlyChart(expensesOnly);
      this.buildDailyChart(expensesOnly);
    });

    // Current month only — for budget and pie chart
    const firstDay = `${this.currentYear}-${String(this.currentMonth).padStart(2, '0')}-01`;
    const lastDay = new Date(this.currentYear, this.currentMonth, 0)
      .toISOString().split('T')[0];

    this.expenseService.getExpensesByDateRange(
      user.id, firstDay, lastDay).subscribe(monthData => {

        const monthExpenses = monthData.filter(e => e.type === 'EXPENSE');
        const monthIncome = monthData.filter(e => e.type === 'INCOME');

        // Monthly budget uses current month spending only
        this.currentMonthSpent = monthExpenses
          .reduce((s, e) => s + Number(e.amount), 0);
        this.currentMonthIncome = monthIncome
          .reduce((s, e) => s + Number(e.amount), 0);

        this.updateBudgetStatus();
        this.buildCurrentMonthIncomeExpenseChart();
        this.buildCategoryPieChart(monthExpenses);
      });

    this.expenseService.getSummaryByCategory(user.id).subscribe(data => {
      if (data.length > 0) {
        this.highestCategory = data.reduce(
          (a, b) => a[1] > b[1] ? a : b)[0];
      }
    });
  }

  buildIncomeExpenseChart(): void {
    this.incomeExpenseData = {
      labels: ['This Month'],
      datasets: [
        {
          label: 'Income',
          data: [this.totalIncome],
          backgroundColor: '#2e7d32',
          borderRadius: 6
        },
        {
          label: 'Expenses',
          data: [this.totalExpenses],
          backgroundColor: '#c62828',
          borderRadius: 6
        }
      ]
    };
  }

  updateBudgetStatus(): void {
    const percent = (this.currentMonthSpent / this.budgetLimit) * 100;
    this.budgetUsedPercent = percent >= 100 ? 100 : Math.floor(percent);
    if (percent >= 90) this.budgetStatus = 'danger';
    else if (percent >= 70) this.budgetStatus = 'warning';
    else this.budgetStatus = 'safe';
  }

  buildCategoryPieChart(monthExpenses: Expense[]): void {
    const map: { [k: string]: number } = {};
    monthExpenses.forEach(e => {
      map[e.category] = (map[e.category] || 0) + Number(e.amount);
    });
    this.pieChartData = {
      labels: Object.keys(map),
      datasets: [{
        data: Object.values(map),
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56',
          '#4BC0C0', '#9966FF', '#FF9F40', '#E7E9ED'],
        hoverOffset: 8
      }]
    };
  }

  buildCurrentMonthIncomeExpenseChart(): void {
    this.incomeExpenseData = {
      labels: ['This Month'],
      datasets: [
        {
          label: 'Income',
          data: [this.currentMonthIncome],
          backgroundColor: '#2e7d32',
          borderRadius: 6
        },
        {
          label: 'Expenses',
          data: [this.currentMonthSpent],
          backgroundColor: '#c62828',
          borderRadius: 6
        }
      ]
    };
  }

  saveBudget(): void {
    this.budgetLimit = this.budgetInput;
    localStorage.setItem('budgetLimit', String(this.budgetLimit));
    this.updateBudgetStatus();
  }

  buildMonthlyChart(expenses: Expense[]): void {
    const monthMap: { [key: string]: number } = {};
    expenses.forEach(e => {
      const month = e.expenseDate.substring(0, 7);
      monthMap[month] = (monthMap[month] || 0) + Number(e.amount);
    });
    const sorted = Object.keys(monthMap).sort();
    this.monthlyChartData = {
      labels: sorted,
      datasets: [{
        label: 'Monthly Spending',
        data: sorted.map(m => monthMap[m]),
        backgroundColor: '#3f51b5',
        hoverBackgroundColor: '#283593',
        borderRadius: 6
      }]
    };
  }

  buildDailyChart(expenses: Expense[]): void {
    const dayMap: { [key: string]: number } = {};
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().split('T')[0];
      dayMap[key] = 0;
    }
    expenses.forEach(e => {
      if (dayMap.hasOwnProperty(e.expenseDate)) {
        dayMap[e.expenseDate] = (dayMap[e.expenseDate] || 0) + Number(e.amount);
      }
    });
    const days = Object.keys(dayMap).sort();
    this.dailyChartData = {
      labels: days.map(d => d.substring(5)),
      datasets: [{
        label: 'Daily Spending',
        data: days.map(d => dayMap[d]),
        borderColor: '#00897b',
        backgroundColor: 'rgba(0, 137, 123, 0.08)',
        fill: true,
        pointBackgroundColor: days.map(d => dayMap[d] > 0 ? '#00897b' : 'transparent'),
        pointBorderColor: days.map(d => dayMap[d] > 0 ? '#00897b' : 'transparent'),
      }]
    };
  }
}