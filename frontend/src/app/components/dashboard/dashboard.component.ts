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
    plugins: {
      legend: { display: false },
      title: { display: false }
    },
    scales: { y: { beginAtZero: true, ticks: { callback: (v) => '₹' + v } } }
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

    this.expenseService.getTotalExpenses(user.id).subscribe(total => {
      this.totalExpenses = total || 0;
      this.updateBudgetStatus();
    });

    this.expenseService.getExpensesByUser(user.id).subscribe(expenses => {
      this.allExpenses = expenses;
      this.expenseCount = expenses.length;
      this.recentExpenses = expenses.slice(-5).reverse();
      this.buildMonthlyChart(expenses);
      this.buildDailyChart(expenses);
    });

    this.expenseService.getSummaryByCategory(user.id).subscribe(data => {
      if (data.length > 0) {
        this.highestCategory = data.reduce((a, b) => a[1] > b[1] ? a : b)[0];
      }
      this.pieChartData = {
        labels: data.map(d => d[0]),
        datasets: [{
          data: data.map(d => d[1]),
          backgroundColor: ['#FF6384','#36A2EB','#FFCE56','#4BC0C0','#9966FF','#FF9F40','#E7E9ED']
        }]
      };
    });
  }

  updateBudgetStatus(): void {
    const percent = (this.totalExpenses / this.budgetLimit) * 100;
    this.budgetUsedPercent = percent >= 100 ? 100 : Math.floor(percent);
    if (percent >= 90) this.budgetStatus = 'danger';
    else if (percent >= 70) this.budgetStatus = 'warning';
    else this.budgetStatus = 'safe';
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