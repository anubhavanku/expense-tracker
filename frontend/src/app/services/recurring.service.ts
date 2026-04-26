import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface RecurringTransaction {
  id?: number;
  title: string;
  description?: string;
  amount: number;
  category: string;
  type: 'INCOME' | 'EXPENSE';
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  startDate: string;
  endDate?: string;
  nextDueDate?: string;
  lastProcessedDate?: string;
  active?: boolean;
  userId: number;
}

@Injectable({ providedIn: 'root' })
export class RecurringService {
  private apiUrl = `${environment.apiUrl}/api/recurring`;

  constructor(private http: HttpClient) { }

  create(userId: number,
    recurring: Partial<RecurringTransaction>):
    Observable<RecurringTransaction> {
    return this.http.post<RecurringTransaction>(
      `${this.apiUrl}/user/${userId}`, recurring);
  }

  getAll(userId: number): Observable<RecurringTransaction[]> {
    return this.http.get<RecurringTransaction[]>(
      `${this.apiUrl}/user/${userId}`);
  }

  getActive(userId: number): Observable<RecurringTransaction[]> {
    return this.http.get<RecurringTransaction[]>(
      `${this.apiUrl}/user/${userId}/active`);
  }

  update(id: number,
    recurring: Partial<RecurringTransaction>):
    Observable<RecurringTransaction> {
    return this.http.put<RecurringTransaction>(
      `${this.apiUrl}/${id}`, recurring);
  }

  toggle(id: number): Observable<RecurringTransaction> {
    return this.http.patch<RecurringTransaction>(
      `${this.apiUrl}/${id}/toggle`, {});
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  manualProcess(): Observable<string> {
    return this.http.post(
      `${this.apiUrl}/process`, {},
      { responseType: 'text' }
    );
  }
}