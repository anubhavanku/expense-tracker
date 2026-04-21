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
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { callback: v => '₹' + v } } }
  };

  // Monthly trend line
  trendType: ChartType = 'line';
  trendData: ChartData<'line'> = { labels: [], datasets: [] };
  trendOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, ticks: { callback: v => '₹' + v }, grid: { color: '#f0f0f0' } },
      x: { grid: { display: false } }
    },
    elements: { line: { tension: 0.4 }, point: { radius: 5 } }
  };

  // Doughnut chart
  doughnutType: 'doughnut' = 'doughnut'; 
  doughnutData: ChartData<'doughnut'> = { labels: [], datasets: [{ data: [] }] };
  doughnutOptions: ChartOptions<'doughnut'> = {
  responsive: true,
  plugins: { legend: { position: 'right' } },
  cutout: '65%'
};

  constructor(
    private expenseService: ExpenseService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    this.expenseService.getExpensesByUser(user.id).subscribe(expenses => {
      this.expenses = expenses;
      this.buildStats(expenses);
      this.buildCategoryBar(expenses);
      this.buildTrend(expenses);
    });

    this.expenseService.getSummaryByCategory(user.id).subscribe(data => {
      this.doughnutData = {
        labels: data.map(d => d[0]),
        datasets: [{
          data: data.map(d => d[1]),
          backgroundColor: ['#FF6384','#36A2EB','#FFCE56','#4BC0C0','#9966FF','#FF9F40','#E7E9ED'],
          hoverOffset: 8
        }]
      };
      if (data.length > 0) {
        const freq: {[k: string]: number} = {};
        this.expenses.forEach(e => freq[e.category] = (freq[e.category] || 0) + 1);
        this.mostFrequentCategory = Object.keys(freq).reduce((a, b) => freq[a] > freq[b] ? a : b);
      }
    });
  }

  buildStats(expenses: Expense[]): void {
    this.totalSpent = expenses.reduce((s, e) => s + Number(e.amount), 0);
    this.avgPerTransaction = expenses.length ? this.totalSpent / expenses.length : 0;
    if (expenses.length) {
      const dates = [...new Set(expenses.map(e => e.expenseDate))];
      this.avgPerDay = this.totalSpent / dates.length;
      this.highestExpense = expenses.reduce((a, b) => Number(a.amount) > Number(b.amount) ? a : b);
    }
  }

  buildCategoryBar(expenses: Expense[]): void {
    const map: {[k: string]: number} = {};
    expenses.forEach(e => map[e.category] = (map[e.category] || 0) + Number(e.amount));
    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);
    this.categoryBarData = {
      labels: sorted.map(s => s[0]),
      datasets: [{
        data: sorted.map(s => s[1]),
        backgroundColor: ['#3f51b5','#00897b','#e53935','#fb8c00','#8e24aa','#039be5','#43a047'],
        borderRadius: 6
      }]
    };
  }

  buildTrend(expenses: Expense[]): void {
    const map: {[k: string]: number} = {};
    expenses.forEach(e => {
      const m = e.expenseDate.substring(0, 7);
      map[m] = (map[m] || 0) + Number(e.amount);
    });
    const sorted = Object.keys(map).sort();
    this.trendData = {
      labels: sorted,
      datasets: [{
        data: sorted.map(m => map[m]),
        borderColor: '#3f51b5',
        backgroundColor: 'rgba(63,81,181,0.08)',
        fill: true,
        pointBackgroundColor: '#3f51b5'
      }]
    };
  }
}