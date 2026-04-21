package com.expensetracker.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class ExpenseDTO {
    private Long id;
    private String title;
    private String description;
    private BigDecimal amount;
    private String category;
    private LocalDate expenseDate;
    private Long userId;
}