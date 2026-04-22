import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Budget {
  id?: number;
  category: string;
  limitAmount: number;
  spentAmount?: number;
  percentage?: number;
  month: number;
  year: number;
  userId: number;
  status?: 'SAFE' | 'WARNING' | 'DANGER' | 'EXCEEDED';
}

@Injectable({ providedIn: 'root' })
export class BudgetService {
  private apiUrl = 'http://localhost:8080/api/budgets';

  constructor(private http: HttpClient) {}

  setBudget(userId: number, budget: Partial<Budget>): Observable<Budget> {
    return this.http.post<Budget>(
      `${this.apiUrl}/user/${userId}`, budget);
  }

  getBudgets(userId: number, month: number, year: number): Observable<Budget[]> {
    return this.http.get<Budget[]>(
      `${this.apiUrl}/user/${userId}?month=${month}&year=${year}`);
  }

  deleteBudget(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}