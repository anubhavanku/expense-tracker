package com.expensetracker.repository;

import com.expensetracker.model.RecurringTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface RecurringTransactionRepository
        extends JpaRepository<RecurringTransaction, Long> {

    List<RecurringTransaction> findByUserId(Long userId);

    List<RecurringTransaction> findByActiveTrue();

    List<RecurringTransaction> findByActiveTrueAndNextDueDateLessThanEqual(
            LocalDate date);

    List<RecurringTransaction> findByUserIdAndActiveTrue(Long userId);
}