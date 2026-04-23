import { Component, OnInit } from '@angular/core';
import { ExpenseService, Expense } from '../../services/expense.service';
import { AuthService } from '../../services/auth.service';

export interface Insight {
  icon: string;
  title: string;
  message: string;
  type: 'positive' | 'negative' | 'warning' | 'neutral';
  value?: string;
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
    private authService: AuthService
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

    this.insightMonthlyComparison(thisMonthExpenses, lastMonthExpenses);
    this.insightCategorySpikes(thisMonthExpenses, lastMonthExpenses);
    this.insightSavingsRate();
    this.insightTopSpendingDay(thisMonthExpenses);
    this.insightMonthlyPrediction(thisMonthExpenses);
    this.insightLargestExpense(thisMonthExpenses);
    this.insightNoSpendingDays(thisMonthExpenses);
    this.insightMostExpensiveCategory(thisMonthExpenses);

    // Sort — show negatives first, then warnings, then positives
    this.insights.sort((a, b) => {
      const order = { negative: 0, warning: 1, neutral: 2, positive: 3 };
      return order[a.type] - order[b.type];
    });
  }

  // 1. Overall month comparison
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
        value: `₹${this.fmt(thisTotal)}`
      });
      return;
    }

    const diff = ((thisTotal - lastTotal) / lastTotal) * 100;
    const absDiff = Math.abs(diff);

    if (diff > 0) {
      this.insights.push({
        icon: '📈',
        title: 'Spending Increased',
        message: `You spent ${absDiff.toFixed(0)}% more this month (₹${this.fmt(thisTotal)}) compared to last month (₹${this.fmt(lastTotal)}).`,
        type: absDiff > 20 ? 'negative' : 'warning',
        value: `+${absDiff.toFixed(0)}%`
      });
    } else {
      this.insights.push({
        icon: '📉',
        title: 'Spending Decreased',
        message: `Great job! You spent ${absDiff.toFixed(0)}% less this month (₹${this.fmt(thisTotal)}) compared to last month (₹${this.fmt(lastTotal)}).`,
        type: 'positive',
        value: `-${absDiff.toFixed(0)}%`
      });
    }
  }

  // 2. Category spikes
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
          value: `+${diff.toFixed(0)}%`
        });
      } else if (diff <= -30) {
        this.insights.push({
          icon: '✅',
          title: `${category} Spending Down`,
          message: `You cut ${category} spending by ${Math.abs(diff).toFixed(0)}% this month. Great discipline!`,
          type: 'positive',
          value: `-${Math.abs(diff).toFixed(0)}%`
        });
      }
    });
  }

  // 3. Savings rate
  private insightSavingsRate(): void {
    const allIncome = this.allExpenses; // already filtered
    const incomeExpenses = this.allExpenses.filter(
      e => (e as any).type === 'INCOME');

    // Use all transactions including income
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
          message: `You're saving ${savingsRate.toFixed(0)}% of your income this month. That's outstanding financial health!`,
          type: 'positive',
          value: `${savingsRate.toFixed(0)}%`
        });
      } else if (savingsRate >= 10) {
        this.insights.push({
          icon: '💰',
          title: 'Good Savings Rate',
          message: `You're saving ${savingsRate.toFixed(0)}% of your income this month. Aim for 20-30% for optimal savings.`,
          type: 'neutral',
          value: `${savingsRate.toFixed(0)}%`
        });
      } else if (savingsRate > 0) {
        this.insights.push({
          icon: '💡',
          title: 'Low Savings Rate',
          message: `You're only saving ${savingsRate.toFixed(0)}% of your income. Consider reducing discretionary spending.`,
          type: 'warning',
          value: `${savingsRate.toFixed(0)}%`
        });
      } else {
        this.insights.push({
          icon: '🚨',
          title: 'Spending Exceeds Income',
          message: `Your expenses exceed your income this month by ₹${this.fmt(Math.abs(income - expense))}. Review your spending urgently.`,
          type: 'negative',
          value: `-₹${this.fmt(Math.abs(income - expense))}`
        });
      }
    });
  }

  // 4. Most expensive day of week
  private insightTopSpendingDay(expenses: Expense[]): void {
    if (expenses.length === 0) return;

    const days = ['Sunday', 'Monday', 'Tuesday',
      'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayMap: { [k: string]: number } = {};

    expenses.forEach(e => {
      const day = days[new Date(e.expenseDate + 'T00:00:00').getDay()];
      dayMap[day] = (dayMap[day] || 0) + Number(e.amount);
    });

    const topDay = Object.keys(dayMap).reduce(
      (a, b) => dayMap[a] > dayMap[b] ? a : b);

    this.insights.push({
      icon: '📆',
      title: 'Highest Spending Day',
      message: `You tend to spend the most on ${topDay}s this month (₹${this.fmt(dayMap[topDay])}). Plan your budget accordingly.`,
      type: 'neutral',
      value: topDay
    });
  }

  // 5. End of month prediction
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
      message: `Based on your spending so far, you're on track to spend ₹${this.fmt(projected)} this month.`,
      type: projected > totalSoFar * 1.5 ? 'warning' : 'neutral',
      value: `₹${this.fmt(projected)}`
    });
  }

  // 6. Largest single expense this month
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
        message: `"${largest.title}" (₹${this.fmt(Number(largest.amount))}) accounts for ${percent.toFixed(0)}% of your total spending this month.`,
        type: percent > 50 ? 'warning' : 'neutral',
        value: `${percent.toFixed(0)}%`
      });
    }
  }

  // 7. No-spend days
  private insightNoSpendingDays(expenses: Expense[]): void {
    const today = new Date();
    const dayOfMonth = today.getDate();

    const spendDays = new Set(expenses.map(e => e.expenseDate)).size;
    const noSpendDays = dayOfMonth - spendDays;

    if (noSpendDays >= 5) {
      this.insights.push({
        icon: '🌟',
        title: 'No-Spend Days',
        message: `You had ${noSpendDays} no-spend days this month! That's excellent spending discipline.`,
        type: 'positive',
        value: `${noSpendDays} days`
      });
    }
  }

  // 8. Most expensive category
  private insightMostExpensiveCategory(expenses: Expense[]): void {
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
        message: `${topCat} makes up ${percent.toFixed(0)}% of your spending this month (₹${this.fmt(map[topCat])}). Consider if this aligns with your priorities.`,
        type: percent > 60 ? 'warning' : 'neutral',
        value: `${percent.toFixed(0)}%`
      });
    }
  }

  // Helpers
  private getMonthExpenses(year: number, month: number): Expense[] {
    return this.allExpenses.filter(e => {
      const d = new Date(e.expenseDate + 'T00:00:00');
      return d.getMonth() + 1 === month && d.getFullYear() === year;
    });
  }

  private getLastMonth(): { year: number; month: number } {
    const d = new Date(this.currentYear, this.currentMonth - 2, 1);
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  }

  private sum(expenses: Expense[]): number {
    return expenses.reduce((s, e) => s + Number(e.amount), 0);
  }

  private fmt(amount: number): string {
    return amount.toLocaleString('en-IN', {
      minimumFractionDigits: 0, maximumFractionDigits: 0
    });
  }

  private groupByCategory(expenses: Expense[]): { [k: string]: number } {
    const map: { [k: string]: number } = {};
    expenses.forEach(e => {
      map[e.category] = (map[e.category] || 0) + Number(e.amount);
    });
    return map;
  }
}