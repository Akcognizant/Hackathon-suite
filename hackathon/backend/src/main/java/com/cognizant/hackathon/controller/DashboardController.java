package com.cognizant.hackathon.controller;

import com.cognizant.hackathon.dto.DashboardStatsDto;
import com.cognizant.hackathon.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/dashboard")
@Tag(name = "Dashboard", description = "Aggregated portal statistics")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @Operation(summary = "Get aggregated submission statistics for the dashboard")
    @GetMapping
    public DashboardStatsDto getStats() {
        return dashboardService.getStats();
    }
}
