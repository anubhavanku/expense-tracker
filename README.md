# 💰 Expense Tracker

> A full-stack personal finance management application built with **Angular**, **Spring Boot**, and **MySQL** — designed to help users track income, expenses, budgets, and gain smart financial insights.

![Angular](https://img.shields.io/badge/Angular-16-red?style=for-the-badge&logo=angular)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.5-green?style=for-the-badge&logo=springboot)
![MySQL](https://img.shields.io/badge/MySQL-8.0-blue?style=for-the-badge&logo=mysql)
![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?style=for-the-badge&logo=docker)
![JWT](https://img.shields.io/badge/JWT-Secured-black?style=for-the-badge&logo=jsonwebtokens)
![CI/CD](https://img.shields.io/badge/CI/CD-GitHub_Actions-2088FF?style=for-the-badge&logo=githubactions)

---

## 📌 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Run with Docker](#run-with-docker-recommended)
  - [Run Locally](#run-locally)
- [API Documentation](#-api-documentation)
- [Project Structure](#-project-structure)
- [CI/CD Pipeline](#-cicd-pipeline)
- [Screenshots](#-screenshots)

---

## ✨ Features

### 🔐 Authentication
- JWT-based secure authentication
- Login with email **or** username
- Password encryption with BCrypt
- Auto token expiry and session management

### 💸 Transaction Management
- Add, edit, delete **income and expenses**
- Categorize transactions (Food, Bills, Salary, etc.)
- Filter by type, category, and date range
- Pagination and sorting on all transactions
- Color-coded income (+) and expense (-) display

### 🔄 Recurring Transactions
- Set up recurring income/expenses (Daily, Weekly, Monthly, Yearly)
- Automated processing via Spring `@Scheduled` job
- Pause, resume, or delete recurring transactions
- Monthly impact summary (income vs expense breakdown)

### 📊 Dashboard
- Real-time financial overview (all-time + current month)
- Monthly budget tracker with custom limit setting
- Spending by Category pie chart
- Monthly Spending bar chart
- Income vs Expenses comparison chart
- Daily Spending trend line (last 30 days)
- Recent transactions table

### 📈 Analytics
- KPI cards: Total spent, avg per day, avg per transaction
- Highest expense and most frequent category
- Category spending bar chart
- Category distribution doughnut chart
- Monthly spending trend line

### 💡 Smart Insights
- Month-over-month spending comparison
- Category spike detection
- Savings rate analysis
- Top spending day of week
- End-of-month spending prediction
- No-spend day tracking
- Budget domination alerts

### 🎯 Budget Management
- Set per-category monthly budgets
- Real-time progress tracking
- Visual status indicators (Safe/Warning/Danger/Exceeded)
- Smart tips based on budget status
- Delete confirmation dialogs

### 👤 User Profile
- Edit username and email
- Change password with current password verification
- Account statistics overview

### 🎨 UI/UX
- Dark / Light mode toggle (persisted)
- Mobile responsive design
- Skeleton loading screens
- Global route loading bar
- Confirmation dialogs for destructive actions
- Color-coded category chips
- Toast notifications for all actions

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Angular 16, TypeScript, Angular Material, Chart.js |
| Backend | Spring Boot 3.5, Java 17, Spring Security, Spring Data JPA |
| Database | MySQL 8.0, Hibernate ORM |
| Authentication | JWT (JSON Web Tokens), BCrypt |
| Documentation | Swagger / OpenAPI 3 |
| Containerization | Docker, Docker Compose, Nginx |
| CI/CD | GitHub Actions, GitHub Container Registry |
| Build Tools | Maven, npm |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────┐
│                   Client Browser                 │
└──────────────────────┬──────────────────────────┘
                       │ HTTP
┌──────────────────────▼──────────────────────────┐
│              Nginx (Port 80)                     │
│         Angular SPA + Reverse Proxy              │
└──────────────────────┬──────────────────────────┘
                       │ /api/*
┌──────────────────────▼──────────────────────────┐
│         Spring Boot Backend (Port 8080)          │
│  ┌─────────────┐  ┌──────────┐  ┌────────────┐  │
│  │ Controllers │→ │ Services │→ │Repositories│  │
│  └─────────────┘  └──────────┘  └─────┬──────┘  │
│                                        │         │
└────────────────────────────────────────┼─────────┘
                                         │ JPA
┌────────────────────────────────────────▼─────────┐
│                MySQL 8.0 Database                 │
│     users │ expenses │ budgets │                  │
│     recurring_transactions                        │
└───────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

| Tool    | Version |
|---------|---------|
| Java    | 17+     |
| Maven   | 3.9+    |
| Node.js | 18+     |
| MySQL   | 8.0+    |
| Docker  | Latest  |

---

### Run with Docker (Recommended)

The easiest way to run the entire application with one command:

```bash
# Clone the repository
git clone https://github.com/anubhavanku/expense-tracker.git
cd expense-tracker

# Create environment file
cp .env.example .env

# Start all services
docker-compose up --build
```

**Services will be available at:**

| Service      | URL                                         |
|--------------|---------------------------------------------|
| Frontend     | http://localhost                            |
| Backend API  | http://localhost:8080                       |
| Swagger Docs | http://localhost:8080/swagger-ui/index.html |

---

### Run Locally

#### 1. Database Setup

```sql
CREATE DATABASE expense_tracker;
CREATE USER 'expenseuser'@'localhost' IDENTIFIED BY 'expense123';
GRANT ALL PRIVILEGES ON expense_tracker.* TO 'expenseuser'@'localhost';
FLUSH PRIVILEGES;
```

#### 2. Backend

```bash
cd backend
mvn spring-boot:run
# Runs on http://localhost:8080
# Tables created automatically by Hibernate
```

#### 3. Frontend

```bash
cd frontend
npm install --legacy-peer-deps
ng serve
# Runs on http://localhost:4200
```

---

## 📖 API Documentation

Live Swagger documentation available at:
http://localhost:8080/swagger-ui/index.html

### Key Endpoints

| Method  | Endpoint | Description |
|---      |---|---|
| POST    | `/api/auth/register` | Register new user |
| POST    | `/api/auth/login` | Login, returns JWT |
| GET     | `/api/expenses/user/{id}/paged` | Paginated transactions |
| POST    | `/api/expenses` | Create transaction |
| PUT     | `/api/expenses/{id}` | Update transaction |
| DELETE  | `/api/expenses/{id}` | Delete transaction |
| GET     | `/api/expenses/user/{id}/summary` | Category summary |
| GET     | `/api/budgets/user/{id}` | Get budgets |
| POST    | `/api/budgets/user/{id}` | Set category budget |
| GET     | `/api/recurring/user/{id}` | Get recurring transactions |
| POST    | `/api/recurring/user/{id}` | Create recurring transaction |
| PATCH   | `/api/recurring/{id}/toggle` | Pause/resume recurring |

---

## 📁 Project Structure

```
expense-tracker/
├── .github/
│   └── workflows/
│       └── ci.yml              # GitHub Actions pipeline
├── backend/
│   ├── src/main/java/com/expensetracker/
│   │   ├── config/             # Security, JWT, Swagger
│   │   ├── controller/         # REST Controllers
│   │   ├── dto/                # Data Transfer Objects
│   │   ├── model/              # JPA Entities
│   │   ├── repository/         # Spring Data repositories
│   │   └── service/            # Business logic
│   ├── Dockerfile
│   └── pom.xml
├── frontend/
│   ├── src/app/
│   │   ├── components/         # Angular components
│   │   ├── guards/             # Route guards
│   │   ├── interceptors/       # HTTP interceptors
│   │   └── services/           # Angular services
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docker-compose.yml
└── README.md
```

---

## ⚙️ CI/CD Pipeline

Every push to `main` triggers the GitHub Actions pipeline:

```
Push to main
│
├── Backend Job
│   ├── Setup Java 17
│   ├── Build with Maven
│   └── Upload JAR artifact
│
├── Frontend Job
│   ├── Setup Node 18
│   ├── Install dependencies
│   ├── Build Angular (production)
│   └── Upload build artifact
│
└── Docker Job (after both pass)
    ├── Build backend image
    ├── Build frontend image
    └── Push to GitHub Container Registry
```

**Docker images available at:**

```
ghcr.io/anubhavanku/expense-tracker-backend:latest
ghcr.io/anubhavanku/expense-tracker-frontend:latest
```

---

## 🗄️ Database Schema

```
users
├── id (PK)
├── username (unique)
├── email (unique)
├── password (BCrypt)
└── created_at

expenses
├── id (PK)
├── title, description
├── amount (DECIMAL)
├── category
├── type (INCOME/EXPENSE)
├── expense_date
├── is_recurring
├── recurring_id (FK)
├── user_id (FK)
└── created_at

budgets
├── id (PK)
├── category
├── limit_amount
├── month, year
├── user_id (FK)
└── created_at

recurring_transactions
├── id (PK)
├── title, description
├── amount, category
├── type (INCOME/EXPENSE)
├── frequency (DAILY/WEEKLY/MONTHLY/YEARLY)
├── start_date, end_date
├── next_due_date
├── last_processed_date
├── active
├── user_id (FK)
└── created_at
```

---

## 🔒 Security

- All API endpoints protected with JWT authentication
- Passwords hashed with BCrypt
- CORS configured for allowed origins
- Input validation on both frontend and backend
- Global exception handling with proper HTTP status codes

---

## 👨‍💻 Author

**Anubhav**
- GitHub: [@anubhavanku](https://github.com/anubhavanku)

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
