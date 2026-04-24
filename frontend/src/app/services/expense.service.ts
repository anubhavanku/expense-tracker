import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Expense {
  id?: number;
  title: string;
  description: string;
  amount: number;
  category: string;
  expenseDate: string;
  userId: number;
  type: 'INCOME' | 'EXPENSE';
}

export interface PageResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
  totalIncome: number;
  totalExpense: number;
}

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {
  private apiUrl = `${environment.apiUrl}/api/expenses`;

  constructor(private http: HttpClient) { }

  createExpense(expense: Expense): Observable<Expense> {
    return this.http.post<Expense>(this.apiUrl, expense);
  }

  getExpensesByUser(userId: number): Observable<Expense[]> {
    return this.http.get<Expense[]>(`${this.apiUrl}/user/${userId}`);
  }

  getExpensesByCategory(userId: number, category: string): Observable<Expense[]> {
    return this.http.get<Expense[]>(`${this.apiUrl}/user/${userId}/category/${category}`);
  }

  getExpensesByDateRange(userId: number, start: string, end: string): Observable<Expense[]> {
    return this.http.get<Expense[]>(`${this.apiUrl}/user/${userId}/range?start=${start}&end=${end}`);
  }

  updateExpense(id: number, expense: Expense): Observable<Expense> {
    return this.http.put<Expense>(`${this.apiUrl}/${id}`, expense);
  }

  deleteExpense(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getTotalExpenses(userId: number): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/user/${userId}/total`);
  }

  getSummaryByCategory(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/user/${userId}/summary`);
  }

  getTotalIncome(userId: number): Observable<number> {
    return this.http.get<number>(
      `${this.apiUrl}/user/${userId}/income`);
  }

  getByType(userId: number, type: string): Observable<Expense[]> {
    return this.http.get<Expense[]>(
      `${this.apiUrl}/user/${userId}/type/${type}`);
  }

  getPagedExpenses(
    userId: number,
    page: number = 0,
    size: number = 10,
    sortBy: string = 'expenseDate',
    sortDir: string = 'desc',
    category?: string,
    type?: string,
    start?: string,
    end?: string
  ): Observable<PageResponse<Expense>> {
    let params = `page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`;
    if (category && category !== 'All') params += `&category=${category}`;
    if (type && type !== 'ALL') params += `&type=${type}`;
    if (start) params += `&start=${start}`;
    if (end) params += `&end=${end}`;
    return this.http.get<PageResponse<Expense>>(
      `${this.apiUrl}/user/${userId}/paged?${params}`);
  }
}