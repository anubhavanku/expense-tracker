import { Injectable } from '@angular/core';
import {
  HttpRequest, HttpHandler, HttpEvent,
  HttpInterceptor, HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../services/auth.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

  constructor(
    private snackBar: MatSnackBar,
    private authService: AuthService
  ) {}

  intercept(request: HttpRequest<unknown>,
            next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        let message = 'Something went wrong';

        if (error.status === 0) {
          message = 'Cannot connect to server. Is the backend running?';
        } else if (error.status === 401) {
          message = 'Session expired. Please login again.';
          this.authService.logout();
        } else if (error.status === 403) {
          message = 'You do not have permission to do this.';
        } else if (error.status === 404) {
          message = 'Resource not found.';
        } else if (error.status === 500) {
          message = 'Server error. Please try again later.';
        } else if (error.error?.message) {
          message = error.error.message;
        }

        this.snackBar.open(message, 'Close', {
          duration: 4000,
          panelClass: ['error-snackbar']
        });

        return throwError(() => error);
      })
    );
  }
}