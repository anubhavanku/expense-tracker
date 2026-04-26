package com.expensetracker.service;

import com.expensetracker.dto.RecurringTransactionDTO;
import com.expensetracker.model.Expense;
import com.expensetracker.model.RecurringTransaction;
import com.expensetracker.model.RecurringTransaction.FrequencyType;
import com.expensetracker.model.User;
import com.expensetracker.repository.ExpenseRepository;
import com.expensetracker.repository.RecurringTransactionRepository;
import com.expensetracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RecurringTransactionService {

    private final RecurringTransactionRepository recurringRepository;
    private final ExpenseRepository expenseRepository;
    private final UserRepository userRepository;

    // ============================================
    // CRUD Operations
    // ============================================

    public RecurringTransactionDTO create(RecurringTransactionDTO dto) {
        User user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        RecurringTransaction recurring = new RecurringTransaction();
        recurring.setTitle(dto.getTitle());
        recurring.setDescription(dto.getDescription());
        recurring.setAmount(dto.getAmount());
        recurring.setCategory(dto.getCategory());
        recurring.setType(Expense.TransactionType.valueOf(dto.getType()));
        recurring.setFrequency(FrequencyType.valueOf(dto.getFrequency()));
        recurring.setStartDate(dto.getStartDate());
        recurring.setEndDate(dto.getEndDate());
        recurring.setNextDueDate(dto.getStartDate());
        recurring.setActive(true);
        recurring.setUser(user);

        return mapToDTO(recurringRepository.save(recurring));
    }

    public List<RecurringTransactionDTO> getByUser(Long userId) {
        return recurringRepository.findByUserId(userId)
                .stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    public List<RecurringTransactionDTO> getActiveByUser(Long userId) {
        return recurringRepository.findByUserIdAndActiveTrue(userId)
                .stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    public RecurringTransactionDTO update(Long id,
                                          RecurringTransactionDTO dto) {
        RecurringTransaction recurring = recurringRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(
                        "Recurring transaction not found"));

        recurring.setTitle(dto.getTitle());
        recurring.setDescription(dto.getDescription());
        recurring.setAmount(dto.getAmount());
        recurring.setCategory(dto.getCategory());
        recurring.setType(Expense.TransactionType.valueOf(dto.getType()));
        recurring.setFrequency(FrequencyType.valueOf(dto.getFrequency()));
        recurring.setEndDate(dto.getEndDate());
        // Keep existing active status if not provided
        if (dto.getActive() != null) {
            recurring.setActive(dto.getActive());
        }

        return mapToDTO(recurringRepository.save(recurring));
    }

    public void delete(Long id) {
        recurringRepository.deleteById(id);
    }

    public RecurringTransactionDTO toggleActive(Long id) {
        RecurringTransaction recurring = recurringRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(
                        "Recurring transaction not found"));
        recurring.setActive(!recurring.getActive());
        return mapToDTO(recurringRepository.save(recurring));
    }

    // ============================================
    // Scheduled Job — runs every day at midnight
    // ============================================

    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void processRecurringTransactions() {
        log.info("Processing recurring transactions for date: {}",
                LocalDate.now());

        List<RecurringTransaction> dueTransactions = recurringRepository
                .findByActiveTrueAndNextDueDateLessThanEqual(LocalDate.now());

        for (RecurringTransaction recurring : dueTransactions) {
            try {
                // Skip if already processed today
                if (recurring.getLastProcessedDate() != null
                        && recurring.getLastProcessedDate()
                        .equals(LocalDate.now())) {
                    log.info("Already processed today: {}",
                            recurring.getTitle());
                    continue;
                }

                // Check if end date has passed
                if (recurring.getEndDate() != null
                        && LocalDate.now()
                        .isAfter(recurring.getEndDate())) {
                    recurring.setActive(false);
                    recurringRepository.save(recurring);
                    continue;
                }

                // Create the expense
                createExpenseFromRecurring(recurring);

                // Update next due date and last processed
                recurring.setLastProcessedDate(LocalDate.now());
                recurring.setNextDueDate(
                        calculateNextDueDate(
                                recurring.getNextDueDate(),
                                recurring.getFrequency()));

                recurringRepository.save(recurring);
                log.info("Processed: {}", recurring.getTitle());

            } catch (Exception e) {
                log.error("Error processing {}: {}",
                        recurring.getId(), e.getMessage());
            }
        }
    }

    // ============================================
    // Helper Methods
    // ============================================

    private void createExpenseFromRecurring(
            RecurringTransaction recurring) {
        Expense expense = new Expense();
        expense.setTitle(recurring.getTitle());
        expense.setDescription("[Recurring] " +
                (recurring.getDescription() != null
                        ? recurring.getDescription() : ""));
        expense.setAmount(recurring.getAmount());
        expense.setCategory(recurring.getCategory());
        expense.setType(recurring.getType());
        expense.setExpenseDate(recurring.getNextDueDate());
        expense.setUser(recurring.getUser());
        expense.setIsRecurring(true);
        expense.setRecurringId(recurring.getId());
        expenseRepository.save(expense);
    }

    private LocalDate calculateNextDueDate(
            LocalDate currentDate, FrequencyType frequency) {
        return switch (frequency) {
            case DAILY -> currentDate.plusDays(1);
            case WEEKLY -> currentDate.plusWeeks(1);
            case MONTHLY -> currentDate.plusMonths(1);
            case YEARLY -> currentDate.plusYears(1);
        };
    }

    private RecurringTransactionDTO mapToDTO(RecurringTransaction r) {
        RecurringTransactionDTO dto = new RecurringTransactionDTO();
        dto.setId(r.getId());
        dto.setTitle(r.getTitle());
        dto.setDescription(r.getDescription());
        dto.setAmount(r.getAmount());
        dto.setCategory(r.getCategory());
        dto.setType(r.getType().name());
        dto.setFrequency(r.getFrequency().name());
        dto.setStartDate(r.getStartDate());
        dto.setEndDate(r.getEndDate());
        dto.setNextDueDate(r.getNextDueDate());
        dto.setLastProcessedDate(r.getLastProcessedDate());
        dto.setActive(r.getActive());
        dto.setUserId(r.getUser().getId());
        return dto;
    }
}