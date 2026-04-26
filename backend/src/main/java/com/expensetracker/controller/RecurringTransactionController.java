package com.expensetracker.controller;

import com.expensetracker.dto.RecurringTransactionDTO;
import com.expensetracker.service.RecurringTransactionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recurring")
@RequiredArgsConstructor
@Tag(name = "Recurring Transactions",
        description = "Manage recurring transactions")
public class RecurringTransactionController {

    private final RecurringTransactionService recurringService;

    @PostMapping("/user/{userId}")
    @Operation(summary = "Create a recurring transaction")
    public ResponseEntity<RecurringTransactionDTO> create(
            @PathVariable Long userId,
            @RequestBody RecurringTransactionDTO dto) {
        dto.setUserId(userId);
        return ResponseEntity.ok(recurringService.create(dto));
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "Get all recurring transactions for user")
    public ResponseEntity<List<RecurringTransactionDTO>> getAll(
            @PathVariable Long userId) {
        return ResponseEntity.ok(recurringService.getByUser(userId));
    }

    @GetMapping("/user/{userId}/active")
    @Operation(summary = "Get active recurring transactions")
    public ResponseEntity<List<RecurringTransactionDTO>> getActive(
            @PathVariable Long userId) {
        return ResponseEntity.ok(recurringService.getActiveByUser(userId));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a recurring transaction")
    public ResponseEntity<RecurringTransactionDTO> update(
            @PathVariable Long id,
            @RequestBody RecurringTransactionDTO dto) {
        return ResponseEntity.ok(recurringService.update(id, dto));
    }

    @PatchMapping("/{id}/toggle")
    @Operation(summary = "Toggle active status")
    public ResponseEntity<RecurringTransactionDTO> toggle(
            @PathVariable Long id) {
        return ResponseEntity.ok(recurringService.toggleActive(id));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a recurring transaction")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        recurringService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/process")
    @Operation(summary = "Manually trigger processing (for testing)")
    public ResponseEntity<String> manualProcess() {
        recurringService.processRecurringTransactions();
        return ResponseEntity.ok("Processing complete");
    }
}