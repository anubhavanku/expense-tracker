import { Component, OnInit } from '@angular/core';
import { ChartData, ChartType, ChartOptions } from 'chart.js';
import { ExpenseService, Expense } from '../../services/expense.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-analytics',
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.scss']
})
export class AnalyticsComponent implements OnInit {
  expenses: Expense[] = [];
  totalSpent = 0;
  avgPerDay = 0;
  avgPerTransaction = 0;
  highestExpense: Expense | null = null;
  mostFrequentCategory = '-';

  // Category bar chart
  categoryBarType: ChartType = 'bar';
  categoryBarData: ChartData<'bar'> = { labels: [], datasets: [] };
  categoryBarOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { callback: v => '₹' + v },
        grid: { color: '#f0f0f0' }
      },
      x: { grid: { display: false } }
    }
  };

  // Monthly trend line
  trendType: 'line' = 'line';
  trendData: ChartData<'line'> = { labels: [], datasets: [] };
  trendOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const value = ctx.parsed?.y ?? 0;
            return '₹' + value.toLocaleString();
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { callback: v => '₹' + v },
        grid: { color: '#f0f0f0' }
      },
      x: { grid: { display: false } }
    },
    elements: {
      line: { tension: 0.4 },
      point: { radius: 5, hoverRadius: 7 }
    }
  };

  // Doughnut chart
  doughnutType: 'doughnut' = 'doughnut';
  doughnutData: ChartData<'doughnut'> = { labels: [], datasets: [{ data: [] }] };
  doughnutOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'right' } },
    cutout: '65%'
  };

  constructor(
    private expenseService: ExpenseService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    this.expenseService.getExpensesByUser(user.id).subscribe(all => {
      // Filter only expenses — exclude income from all analytics
      const expensesOnly = all.filter(e => e.type === 'EXPENSE');
      this.expenses = expensesOnly;

      this.buildStats(expensesOnly);
      this.buildCategoryBar(expensesOnly);
      this.buildTrend(expensesOnly);
      this.buildDoughnut(expensesOnly);
    });
  }

  buildStats(expenses: Expense[]): void {
    // Total
    this.totalSpent = expenses.reduce(
      (s, e) => s + Number(e.amount), 0);

    // Avg per transaction
    this.avgPerTransaction = expenses.length
      ? this.totalSpent / expenses.length : 0;

    // Avg per day — unique days that had spending
    if (expenses.length) {
      const uniqueDays = new Set(expenses.map(e => e.expenseDate)).size;
      this.avgPerDay = uniqueDays > 0
        ? this.totalSpent / uniqueDays : 0;

      // Highest expense
      this.highestExpense = expenses.reduce((a, b) =>
        Number(a.amount) > Number(b.amount) ? a : b);

      // Most frequent category — count occurrences
      const freq: { [k: string]: number } = {};
      expenses.forEach(e => {
        freq[e.category] = (freq[e.category] || 0) + 1;
      });
      this.mostFrequentCategory = Object.keys(freq).reduce(
        (a, b) => freq[a] > freq[b] ? a : b);
    }
  }

  buildCategoryBar(expenses: Expense[]): void {
    const map: { [k: string]: number } = {};
    expenses.forEach(e => {
      map[e.category] = (map[e.category] || 0) + Number(e.amount);
    });
    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);
    this.categoryBarData = {
      labels: sorted.map(s => s[0]),
      datasets: [{
        label: 'Amount Spent',
        data: sorted.map(s => s[1]),
        backgroundColor: [
          '#3f51b5', '#00897b', '#e53935',
          '#fb8c00', '#8e24aa', '#039be5', '#43a047'
        ],
        borderRadius: 6
      }]
    };
  }

  buildTrend(expenses: Expense[]): void {
    // Group by month
    const map: { [k: string]: number } = {};
    expenses.forEach(e => {
      const month = e.expenseDate.substring(0, 7);
      map[month] = (map[month] || 0) + Number(e.amount);
    });

    const sorted = Object.keys(map).sort();

    this.trendData = {
      labels: sorted.map(m => {
        const [year, month] = m.split('-');
        return new Date(+year, +month - 1)
          .toLocaleString('default', { month: 'short', year: '2-digit' });
      }),
      datasets: [{
        label: 'Monthly Spending',
        data: sorted.map(m => map[m]),
        borderColor: '#3f51b5',
        backgroundColor: 'rgba(63,81,181,0.08)',
        fill: true,
        pointBackgroundColor: '#3f51b5',
        pointBorderColor: '#fff',
        pointBorderWidth: 2
      }]
    };
  }

  buildDoughnut(expenses: Expense[]): void {
    const map: { [k: string]: number } = {};
    expenses.forEach(e => {
      map[e.category] = (map[e.category] || 0) + Number(e.amount);
    });
    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);
    this.doughnutData = {
      labels: sorted.map(s => s[0]),
      datasets: [{
        data: sorted.map(s => s[1]),
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56',
          '#4BC0C0', '#9966FF', '#FF9F40', '#E7E9ED'
        ],
        hoverOffset: 8
      }]
    };
  }
}