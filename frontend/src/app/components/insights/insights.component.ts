import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ExpenseService, Expense } from '../../services/expense.service';
import { AuthService } from '../../services/auth.service';

export interface Insight {
  icon: string;
  title: string;
  message: string;
  type: 'positive' | 'negative' | 'warning' | 'neutral';
  value?: string;
  action?: {
    label: string;
    route?: string;
    callback?: () => void;
  };
}

@Component({
  selector: 'app-insights',
  templateUrl: './insights.component.html',
  styleUrls: ['./insights.component.scss']
})
export class InsightsComponent implements OnInit {
  insights: Insight[] = [];
  isLoading = true;

  private allExpenses: Expense[] = [];
  private currentMonth = new Date().getMonth() + 1;
  private currentYear = new Date().getFullYear();

  constructor(
    private expenseService: ExpenseService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    this.expenseService.getExpensesByUser(user.id).subscribe(all => {
      this.allExpenses = all.filter(e => e.type === 'EXPENSE');
      this.generateInsights();
      this.isLoading = false;
    });
  }

  generateInsights(): void {
    this.insights = [];

    const thisMonthExpenses = this.getMonthExpenses(
      this.currentYear, this.currentMonth);
    const lastMonthDate = this.getLastMonth();
    const lastMonthExpenses = this.getMonthExpenses(
      lastMonthDate.year, lastMonthDate.month);

    this.insightMonthlyComparison(
      thisMonthExpenses, lastMonthExpenses);
    this.insightCategorySpikes(
      thisMonthExpenses, lastMonthExpenses);
    this.insightSavingsRate();
    this.insightTopSpendingDay(thisMonthExpenses);
    this.insightMonthlyPrediction(thisMonthExpenses);
    this.insightLargestExpense(thisMonthExpenses);
    this.insightNoSpendingDays(thisMonthExpenses);
    this.insightMostExpensiveCategory(thisMonthExpenses);

    this.insights.sort((a, b) => {
      const order = {
        negative: 0, warning: 1, neutral: 2, positive: 3
      };
      return order[a.type] - order[b.type];
    });
  }

  handleAction(insight: Insight): void {
    if (insight.action?.route) {
      this.router.navigate([insight.action.route]);
    } else if (insight.action?.callback) {
      insight.action.callback();
    }
  }

  private insightMonthlyComparison(
    thisMonth: Expense[], lastMonth: Expense[]): void {
    const thisTotal = this.sum(thisMonth);
    const lastTotal = this.sum(lastMonth);

    if (lastTotal === 0) {
      this.insights.push({
        icon: '📅',
        title: 'First Month Tracked',
        message: `You've spent ₹${this.fmt(thisTotal)} this month. Keep tracking to see trends!`,
        type: 'neutral',
        value: `₹${this.fmt(thisTotal)}`,
        action: {
          label: 'View Transactions',
          route: '/expenses'
        }
      });
      return;
    }

    const diff = ((thisTotal - lastTotal) / lastTotal) * 100;
    const absDiff = Math.abs(diff);

    if (diff > 0) {
      this.insights.push({
        icon: '📈',
        title: 'Spending Increased',
        message: `You spent ${absDiff.toFixed(0)}% more this month (₹${this.fmt(thisTotal)}) vs last month (₹${this.fmt(lastTotal)}).`,
        type: absDiff > 20 ? 'negative' : 'warning',
        value: `+${absDiff.toFixed(0)}%`,
        action: {
          label: 'Review Expenses',
          route: '/expenses'
        }
      });
    } else {
      this.insights.push({
        icon: '📉',
        title: 'Spending Decreased',
        message: `Great job! You spent ${absDiff.toFixed(0)}% less this month (₹${this.fmt(thisTotal)}) vs last month (₹${this.fmt(lastTotal)}).`,
        type: 'positive',
        value: `-${absDiff.toFixed(0)}%`,
        action: {
          label: 'See Analytics',
          route: '/analytics'
        }
      });
    }
  }

  private insightCategorySpikes(
    thisMonth: Expense[], lastMonth: Expense[]): void {
    const thisMap = this.groupByCategory(thisMonth);
    const lastMap = this.groupByCategory(lastMonth);

    Object.keys(thisMap).forEach(category => {
      const thisAmt = thisMap[category];
      const lastAmt = lastMap[category] || 0;
      if (lastAmt === 0) return;
      const diff = ((thisAmt - lastAmt) / lastAmt) * 100;

      if (diff >= 50) {
        this.insights.push({
          icon: '⚠️',
          title: `${category} Spending Spiked`,
          message: `Your ${category} spending increased by ${diff.toFixed(0)}% this month (₹${this.fmt(thisAmt)} vs ₹${this.fmt(lastAmt)} last month).`,
          type: 'warning',
          value: `+${diff.toFixed(0)}%`,
          action: {
            label: `Set ${category} Budget`,
            route: '/budget'
          }
        });
      } else if (diff <= -30) {
        this.insights.push({
          icon: '✅',
          title: `${category} Spending Down`,
          message: `You cut ${category} spending by ${Math.abs(diff).toFixed(0)}% this month. Great discipline!`,
          type: 'positive',
          value: `-${Math.abs(diff).toFixed(0)}%`,
          action: {
            label: 'See Full Analytics',
            route: '/analytics'
          }
        });
      }
    });
  }

  private insightSavingsRate(): void {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    this.expenseService.getExpensesByUser(user.id).subscribe(all => {
      const thisMonthAll = all.filter(e => {
        const d = new Date(e.expenseDate);
        return d.getMonth() + 1 === this.currentMonth
          && d.getFullYear() === this.currentYear;
      });

      const income = thisMonthAll
        .filter(e => e.type === 'INCOME')
        .reduce((s, e) => s + Number(e.amount), 0);

      const expense = thisMonthAll
        .filter(e => e.type === 'EXPENSE')
        .reduce((s, e) => s + Number(e.amount), 0);

      if (income === 0) return;

      const savingsRate = ((income - expense) / income) * 100;

      if (savingsRate >= 30) {
        this.insights.push({
          icon: '🏆',
          title: 'Excellent Savings Rate',
          message: `You're saving ${savingsRate.toFixed(0)}% of your income this month. Outstanding financial health!`,
          type: 'positive',
          value: `${savingsRate.toFixed(0)}%`,
          action: {
            label: 'View Dashboard',
            route: '/dashboard'
          }
        });
      } else if (savingsRate >= 10) {
        this.insights.push({
          icon: '💰',
          title: 'Good Savings Rate',
          message: `You're saving ${savingsRate.toFixed(0)}% of your income. Aim for 20-30% for optimal savings.`,
          type: 'neutral',
          value: `${savingsRate.toFixed(0)}%`,
          action: {
            label: 'Set Budget Goals',
            route: '/budget'
          }
        });
      } else if (savingsRate > 0) {
        this.insights.push({
          icon: '💡',
          title: 'Low Savings Rate',
          message: `You're only saving ${savingsRate.toFixed(0)}% of your income. Consider reducing discretionary spending.`,
          type: 'warning',
          value: `${savingsRate.toFixed(0)}%`,
          action: {
            label: 'Review Budgets',
            route: '/budget'
          }
        });
      } else {
        this.insights.push({
          icon: '🚨',
          title: 'Spending Exceeds Income',
          message: `Your expenses exceed income by ₹${this.fmt(Math.abs(income - expense))} this month.`,
          type: 'negative',
          value: `-₹${this.fmt(Math.abs(income - expense))}`,
          action: {
            label: 'Cut Expenses Now',
            route: '/expenses'
          }
        });
      }
    });
  }

  private insightTopSpendingDay(expenses: Expense[]): void {
    if (expenses.length === 0) return;
    const days = ['Sunday', 'Monday', 'Tuesday',
      'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayMap: { [k: string]: number } = {};

    expenses.forEach(e => {
      const day = days[
        new Date(e.expenseDate + 'T00:00:00').getDay()];
      dayMap[day] = (dayMap[day] || 0) + Number(e.amount);
    });

    const topDay = Object.keys(dayMap).reduce(
      (a, b) => dayMap[a] > dayMap[b] ? a : b);

    this.insights.push({
      icon: '📆',
      title: 'Highest Spending Day',
      message: `You spend the most on ${topDay}s (₹${this.fmt(dayMap[topDay])}). Plan your budget accordingly.`,
      type: 'neutral',
      value: topDay,
      action: {
        label: 'View Transactions',
        route: '/expenses'
      }
    });
  }

  private insightMonthlyPrediction(expenses: Expense[]): void {
    const today = new Date();
    const dayOfMonth = today.getDate();
    const daysInMonth = new Date(
      today.getFullYear(), today.getMonth() + 1, 0).getDate();

    if (dayOfMonth < 5) return;

    const totalSoFar = this.sum(expenses);
    const dailyAvg = totalSoFar / dayOfMonth;
    const projected = dailyAvg * daysInMonth;

    this.insights.push({
      icon: '🔮',
      title: 'Projected Monthly Spend',
      message: `Based on your pace, you'll spend ₹${this.fmt(projected)} this month. ${projected > totalSoFar * 1.3 ? 'Consider slowing down.' : 'You\'re on a good track!'}`,
      type: projected > totalSoFar * 1.5 ? 'warning' : 'neutral',
      value: `₹${this.fmt(projected)}`,
      action: {
        label: 'Check Budget',
        route: '/budget'
      }
    });
  }

  private insightLargestExpense(expenses: Expense[]): void {
    if (expenses.length === 0) return;
    const largest = expenses.reduce((a, b) =>
      Number(a.amount) > Number(b.amount) ? a : b);
    const total = this.sum(expenses);
    const percent = (Number(largest.amount) / total) * 100;

    if (percent > 30) {
      this.insights.push({
        icon: '💸',
        title: 'Large Single Expense',
        message: `"${largest.title}" (₹${this.fmt(Number(largest.amount))}) is ${percent.toFixed(0)}% of your total spending this month.`,
        type: percent > 50 ? 'warning' : 'neutral',
        value: `${percent.toFixed(0)}%`,
        action: {
          label: 'View Expense',
          route: '/expenses'
        }
      });
    }
  }

  private insightNoSpendingDays(expenses: Expense[]): void {
    const today = new Date();
    const dayOfMonth = today.getDate();
    const spendDays = new Set(
      expenses.map(e => e.expenseDate)).size;
    const noSpendDays = dayOfMonth - spendDays;

    if (noSpendDays >= 5) {
      this.insights.push({
        icon: '🌟',
        title: 'No-Spend Days',
        message: `You had ${noSpendDays} no-spend days this month! That's excellent spending discipline.`,
        type: 'positive',
        value: `${noSpendDays} days`,
        action: {
          label: 'Keep it up!',
          route: '/dashboard'
        }
      });
    }
  }

  private insightMostExpensiveCategory(
    expenses: Expense[]): void {
    if (expenses.length === 0) return;
    const map = this.groupByCategory(expenses);
    const total = this.sum(expenses);
    const topCat = Object.keys(map).reduce(
      (a, b) => map[a] > map[b] ? a : b);
    const percent = (map[topCat] / total) * 100;

    if (percent > 40) {
      this.insights.push({
        icon: '🏷️',
        title: `${topCat} Dominates Budget`,
        message: `${topCat} is ${percent.toFixed(0)}% of spending this month (₹${this.fmt(map[topCat])}). Consider setting a budget limit.`,
        type: percent > 60 ? 'warning' : 'neutral',
        value: `${percent.toFixed(0)}%`,
        action: {
          label: `Budget ${topCat}`,
          route: '/budget'
        }
      });
    }
  }

  // Helpers
  private getMonthExpenses(
    year: number, month: number): Expense[] {
    return this.allExpenses.filter(e => {
      const d = new Date(e.expenseDate + 'T00:00:00');
      return d.getMonth() + 1 === month
        && d.getFullYear() === year;
    });
  }

  private getLastMonth(): { year: number; month: number } {
    const d = new Date(
      this.currentYear, this.currentMonth - 2, 1);
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  }

  private sum(expenses: Expense[]): number {
    return expenses.reduce(
      (s, e) => s + Number(e.amount), 0);
  }

  private fmt(amount: number): string {
    return amount.toLocaleString('en-IN', {
      minimumFractionDigits: 0, maximumFractionDigits: 0
    });
  }

  private groupByCategory(
    expenses: Expense[]): { [k: string]: number } {
    const map: { [k: string]: number } = {};
    expenses.forEach(e => {
      map[e.category] = (map[e.category] || 0)
        + Number(e.amount);
    });
    return map;
  }
}