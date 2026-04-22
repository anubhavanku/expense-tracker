package com.expensetracker.service;

import com.expensetracker.dto.BudgetDTO;
import com.expensetracker.model.Budget;
import com.expensetracker.model.Expense;
import com.expensetracker.model.User;
import com.expensetracker.repository.BudgetRepository;
import com.expensetracker.repository.ExpenseRepository;
import com.expensetracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BudgetService {

    private final BudgetRepository budgetRepository;
    private final ExpenseRepository expenseRepository;
    private final UserRepository userRepository;

    public BudgetDTO setBudget(Long userId, String category,
                               BigDecimal limit, int month, int year) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Budget budget = budgetRepository
                .findByUserIdAndCategoryAndMonthAndYear(
                        userId, category, month, year)
                .orElse(new Budget());

        budget.setUser(user);
        budget.setCategory(category);
        budget.setLimitAmount(limit);
        budget.setMonth(month);
        budget.setYear(year);

        Budget saved = budgetRepository.save(budget);
        return enrichWithSpending(saved, userId);
    }

    public List<BudgetDTO> getBudgetsForMonth(
            Long userId, int month, int year) {
        return budgetRepository
                .findByUserIdAndMonthAndYear(userId, month, year)
                .stream()
                .map(b -> enrichWithSpending(b, userId))
                .collect(Collectors.toList());
    }

    public void deleteBudget(Long id) {
        budgetRepository.deleteById(id);
    }

    private BudgetDTO enrichWithSpending(Budget budget, Long userId) {
        // Calculate how much spent in this category this month
        LocalDate start = LocalDate.of(
                budget.getYear(), budget.getMonth(), 1);
        LocalDate end = start.withDayOfMonth(
                start.lengthOfMonth());

        List<Expense> expenses = expenseRepository
                .findByUserIdAndExpenseDateBetween(userId, start, end);

        double spent = expenses.stream()
                .filter(e -> e.getCategory().equals(budget.getCategory()))
                .filter(e -> e.getType().name().equals("EXPENSE"))
                .mapToDouble(e -> e.getAmount().doubleValue())
                .sum();

        double limit = budget.getLimitAmount().doubleValue();
        double percentage = limit > 0 ? (spent / limit) * 100 : 0;

        String status = percentage >= 100 ? "EXCEEDED"
                : percentage >= 90 ? "DANGER"
                  : percentage >= 70 ? "WARNING"
                    : "SAFE";

        BudgetDTO dto = new BudgetDTO();
        dto.setId(budget.getId());
        dto.setCategory(budget.getCategory());
        dto.setLimitAmount(budget.getLimitAmount());
        dto.setSpentAmount(spent);
        dto.setPercentage(Math.min(percentage, 100));
        dto.setMonth(budget.getMonth());
        dto.setYear(budget.getYear());
        dto.setUserId(userId);
        dto.setStatus(status);
        return dto;
    }
}