package com.expensetracker.repository;

import com.expensetracker.model.Expense;
import com.expensetracker.model.Expense.TransactionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    List<Expense> findByUserId(Long userId);
    List<Expense> findByUserIdAndCategory(Long userId, String category);
    List<Expense> findByUserIdAndExpenseDateBetween(
            Long userId, LocalDate start, LocalDate end);
    List<Expense> findByUserIdAndType(
            Long userId, TransactionType type);

    @Query("SELECT SUM(e.amount) FROM Expense e " +
            "WHERE e.user.id = :userId AND e.type = 'EXPENSE'")
    Double getTotalExpenseByUserId(@Param("userId") Long userId);

    @Query("SELECT SUM(e.amount) FROM Expense e " +
            "WHERE e.user.id = :userId AND e.type = 'INCOME'")
    Double getTotalIncomeByUserId(@Param("userId") Long userId);

    @Query("SELECT e.category, SUM(e.amount) FROM Expense e " +
            "WHERE e.user.id = :userId AND e.type = 'EXPENSE' " +
            "GROUP BY e.category")
    List<Object[]> getExpensesByCategory(@Param("userId") Long userId);

    @Query("SELECT e.category, SUM(e.amount) FROM Expense e " +
            "WHERE e.user.id = :userId GROUP BY e.category")
    List<Object[]> getAllByCategory(@Param("userId") Long userId);
}