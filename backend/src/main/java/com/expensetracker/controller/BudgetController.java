package com.expensetracker.controller;

import com.expensetracker.dto.BudgetDTO;
import com.expensetracker.service.BudgetService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/budgets")
@RequiredArgsConstructor
@Tag(name = "Budgets", description = "Per-category budget management")
public class BudgetController {

    private final BudgetService budgetService;

    @PostMapping("/user/{userId}")
    @Operation(summary = "Set a category budget")
    public ResponseEntity<BudgetDTO> setBudget(
            @PathVariable Long userId,
            @RequestBody Map<String, Object> request) {
        String category = (String) request.get("category");
        BigDecimal limit = new BigDecimal(
                request.get("limitAmount").toString());
        int month = (Integer) request.get("month");
        int year = (Integer) request.get("year");
        return ResponseEntity.ok(
                budgetService.setBudget(userId, category, limit, month, year));
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "Get budgets for current month")
    public ResponseEntity<List<BudgetDTO>> getBudgets(
            @PathVariable Long userId,
            @RequestParam int month,
            @RequestParam int year) {
        return ResponseEntity.ok(
                budgetService.getBudgetsForMonth(userId, month, year));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a budget")
    public ResponseEntity<Void> deleteBudget(@PathVariable Long id) {
        budgetService.deleteBudget(id);
        return ResponseEntity.noContent().build();
    }
}