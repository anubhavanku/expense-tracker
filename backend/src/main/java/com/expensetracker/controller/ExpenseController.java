package com.expensetracker.controller;

import com.expensetracker.dto.ExpenseDTO;
import com.expensetracker.service.ExpenseService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import com.expensetracker.dto.PageResponse;
import java.time.LocalDate;

@Tag(name = "Transactions", description = "Manage income and expenses")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping("/api/expenses")
@RequiredArgsConstructor
public class ExpenseController {

    private final ExpenseService expenseService;

    @Operation(summary = "Create a new transaction")
    @PostMapping
    public ResponseEntity<ExpenseDTO> createExpense(@RequestBody ExpenseDTO dto) {
        return ResponseEntity.ok(expenseService.createExpense(dto));
    }

    @Operation(summary = "Get all transactions for a user")
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ExpenseDTO>> getExpensesByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(expenseService.getExpensesByUser(userId));
    }

    @Operation(summary = "Get transactions by category")
    @GetMapping("/user/{userId}/category/{category}")
    public ResponseEntity<List<ExpenseDTO>> getByCategory(
            @PathVariable Long userId,
            @PathVariable String category) {
        return ResponseEntity.ok(expenseService.getExpensesByCategory(userId, category));
    }

    @Operation(summary = "Get transactions by date range")
    @GetMapping("/user/{userId}/range")
    public ResponseEntity<List<ExpenseDTO>> getByDateRange(
            @PathVariable Long userId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        return ResponseEntity.ok(expenseService.getExpensesByDateRange(userId, start, end));
    }

    @Operation(summary = "Update a transaction")
    @PutMapping("/{id}")
    public ResponseEntity<ExpenseDTO> updateExpense(
            @PathVariable Long id,
            @RequestBody ExpenseDTO dto) {
        return ResponseEntity.ok(expenseService.updateExpense(id, dto));
    }

    @Operation(summary = "Delete a transaction")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteExpense(@PathVariable Long id) {
        expenseService.deleteExpense(id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Get total expenses")
    @GetMapping("/user/{userId}/total")
    public ResponseEntity<Double> getTotalExpenses(@PathVariable Long userId) {
        return ResponseEntity.ok(expenseService.getTotalExpenses(userId));
    }

    @Operation(summary = "Get spending summary by category")
    @GetMapping("/user/{userId}/summary")
    public ResponseEntity<List<Object[]>> getSummaryByCategory(@PathVariable Long userId) {
        return ResponseEntity.ok(expenseService.getExpensesSummaryByCategory(userId));
    }

    @Operation(summary = "Get total income")
    @GetMapping("/user/{userId}/income")
    public ResponseEntity<Double> getTotalIncome(
            @PathVariable Long userId) {
        return ResponseEntity.ok(expenseService.getTotalIncome(userId));
    }

    @GetMapping("/user/{userId}/type/{type}")
    public ResponseEntity<List<ExpenseDTO>> getByType(
            @PathVariable Long userId,
            @PathVariable String type) {
        return ResponseEntity.ok(expenseService.getByType(userId, type));
    }

    @GetMapping("/user/{userId}/paged")
    @Operation(summary = "Get paginated and filtered transactions")
    public ResponseEntity<PageResponse<ExpenseDTO>> getPagedExpenses(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "expenseDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String type,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {

        return ResponseEntity.ok(
                expenseService.getExpensesWithFilters(
                        userId, category, type, start, end,
                        page, size, sortBy, sortDir)
        );
    }
}