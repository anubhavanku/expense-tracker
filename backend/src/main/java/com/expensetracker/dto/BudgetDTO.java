package com.expensetracker.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class BudgetDTO {
    private Long id;
    private String category;
    private BigDecimal limitAmount;
    private Double spentAmount;
    private Double percentage;
    private Integer month;
    private Integer year;
    private Long userId;
    private String status;
}