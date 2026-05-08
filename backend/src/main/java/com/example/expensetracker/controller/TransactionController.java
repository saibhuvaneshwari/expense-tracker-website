package com.example.expensetracker.controller;

import com.example.expensetracker.model.Transaction;
import com.example.expensetracker.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    @Autowired
    private TransactionRepository repository;

    @GetMapping
    public List<Transaction> getAllTransactions() {
        return repository.findAll();
    }

    @PostMapping
    public Transaction createTransaction(@RequestBody Transaction transaction) {
        if (transaction.getCreatedAt() == null) {
            transaction.setCreatedAt(LocalDateTime.now());
        }
        transaction.setUpdatedAt(LocalDateTime.now());
        return repository.save(transaction);
    }

    @PutMapping("/{id}")
    public Transaction updateTransaction(@PathVariable String id, @RequestBody Transaction transaction) {
        transaction.setId(id);
        transaction.setUpdatedAt(LocalDateTime.now());
        return repository.save(transaction);
    }

    @DeleteMapping("/{id}")
    public void deleteTransaction(@PathVariable String id) {
        repository.deleteById(id);
    }
}
