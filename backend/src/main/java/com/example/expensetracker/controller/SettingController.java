package com.example.expensetracker.controller;

import com.example.expensetracker.model.Setting;
import com.example.expensetracker.repository.SettingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/settings")
public class SettingController {

    @Autowired
    private SettingRepository repository;

    @GetMapping
    public List<Setting> getAllSettings() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    public Setting getSetting(@PathVariable String id) {
        return repository.findById(id).orElse(null);
    }

    @PostMapping
    public Setting saveSetting(@RequestBody Setting setting) {
        return repository.save(setting);
    }

    @PutMapping("/{id}")
    public Setting updateSetting(@PathVariable String id, @RequestBody Setting setting) {
        setting.setId(id);
        return repository.save(setting);
    }
}
