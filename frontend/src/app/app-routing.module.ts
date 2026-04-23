import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ExpenseListComponent } from './components/expense-list/expense-list.component';
import { ProfileComponent } from './components/profile/profile.component';
import { AnalyticsComponent } from './components/analytics/analytics.component';
import { AuthGuard } from './guards/auth.guard';
import { BudgetComponent } from './components/budget/budget.component';
import { InsightsComponent } from './components/insights/insights.component';

const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: 'dashboard', component: DashboardComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'expenses', component: ExpenseListComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'analytics', component: AnalyticsComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'profile', component: ProfileComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'budget', component: BudgetComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'insights', component: InsightsComponent,
    canActivate: [AuthGuard]
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }