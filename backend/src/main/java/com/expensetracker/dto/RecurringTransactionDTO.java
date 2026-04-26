package com.expensetracker.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class RecurringTransactionDTO {
    private Long id;
    private String title;
    private String description;
    private BigDecimal amount;
    private String category;
    private String type;
    private String frequency;
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDate nextDueDate;
    private LocalDate lastProcessedDate;
//    private Boolean active;
    private Boolean active = true;
    private Long userId;
}