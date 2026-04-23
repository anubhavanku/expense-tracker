package com.expensetracker.repository;

import com.expensetracker.model.Expense;
import com.expensetracker.model.Expense.TransactionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    // Paginated queries
    Page<Expense> findByUserId(Long userId, Pageable pageable);

    Page<Expense> findByUserIdAndType(
            Long userId, TransactionType type, Pageable pageable);

    Page<Expense> findByUserIdAndCategory(
            Long userId, String category, Pageable pageable);

    Page<Expense> findByUserIdAndExpenseDateBetween(
            Long userId, LocalDate start, LocalDate end, Pageable pageable);

    @Query("SELECT e FROM Expense e WHERE e.user.id = :userId " +
            "AND (:category IS NULL OR e.category = :category) " +
            "AND (:type IS NULL OR e.type = :type) " +
            "AND (:start IS NULL OR e.expenseDate >= :start) " +
            "AND (:end IS NULL OR e.expenseDate <= :end)")
    Page<Expense> findWithFilters(
            @Param("userId") Long userId,
            @Param("category") String category,
            @Param("type") TransactionType type,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end,
            Pageable pageable);

    // Non-paginated — for charts and analytics
    List<Expense> findByUserId(Long userId);
    List<Expense> findByUserIdAndType(Long userId, TransactionType type);
    List<Expense> findByUserIdAndExpenseDateBetween(
            Long userId, LocalDate start, LocalDate end);

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
}