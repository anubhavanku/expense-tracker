package com.expensetracker.service;

import com.expensetracker.dto.ExpenseDTO;
import com.expensetracker.model.Expense;
import com.expensetracker.model.Expense.TransactionType;
import com.expensetracker.model.User;
import com.expensetracker.repository.ExpenseRepository;
import com.expensetracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final UserRepository userRepository;

    public ExpenseDTO createExpense(ExpenseDTO dto) {
        User user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Expense expense = new Expense();
        expense.setTitle(dto.getTitle());
        expense.setDescription(dto.getDescription());
        expense.setAmount(dto.getAmount());
        expense.setCategory(dto.getCategory());
        expense.setExpenseDate(dto.getExpenseDate());
        expense.setUser(user);
        expense.setType(dto.getType() != null ?
                TransactionType.valueOf(dto.getType()) : TransactionType.EXPENSE);

        return mapToDTO(expenseRepository.save(expense));
    }

    public List<ExpenseDTO> getExpensesByUser(Long userId) {
        return expenseRepository.findByUserId(userId)
                .stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    public List<ExpenseDTO> getByType(Long userId, String type) {
        return expenseRepository
                .findByUserIdAndType(userId, TransactionType.valueOf(type))
                .stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    public List<ExpenseDTO> getExpensesByCategory(
            Long userId, String category) {
        return expenseRepository
                .findByUserIdAndCategory(userId, category)
                .stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    public List<ExpenseDTO> getExpensesByDateRange(
            Long userId, LocalDate start, LocalDate end) {
        return expenseRepository
                .findByUserIdAndExpenseDateBetween(userId, start, end)
                .stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    public ExpenseDTO updateExpense(Long id, ExpenseDTO dto) {
        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Expense not found"));
        expense.setTitle(dto.getTitle());
        expense.setDescription(dto.getDescription());
        expense.setAmount(dto.getAmount());
        expense.setCategory(dto.getCategory());
        expense.setExpenseDate(dto.getExpenseDate());
        if (dto.getType() != null) {
            expense.setType(TransactionType.valueOf(dto.getType()));
        }
        return mapToDTO(expenseRepository.save(expense));
    }

    public void deleteExpense(Long id) {
        expenseRepository.deleteById(id);
    }

    public Double getTotalExpenses(Long userId) {
        Double total = expenseRepository.getTotalExpenseByUserId(userId);
        return total != null ? total : 0.0;
    }

    public Double getTotalIncome(Long userId) {
        Double total = expenseRepository.getTotalIncomeByUserId(userId);
        return total != null ? total : 0.0;
    }

    public List<Object[]> getExpensesSummaryByCategory(Long userId) {
        return expenseRepository.getExpensesByCategory(userId);
    }

    private ExpenseDTO mapToDTO(Expense expense) {
        ExpenseDTO dto = new ExpenseDTO();
        dto.setId(expense.getId());
        dto.setTitle(expense.getTitle());
        dto.setDescription(expense.getDescription());
        dto.setAmount(expense.getAmount());
        dto.setCategory(expense.getCategory());
        dto.setExpenseDate(expense.getExpenseDate());
        dto.setUserId(expense.getUser().getId());
        dto.setType(expense.getType().name());
        return dto;
    }
}