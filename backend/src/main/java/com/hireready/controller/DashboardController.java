package com.hireready.controller;

import com.hireready.dto.ApiResponse;
import com.hireready.service.DashboardService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/user")
@CrossOrigin(origins = "${cors.allowed.origins}")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    /**
     * Get comprehensive dashboard metrics for user
     */
    @GetMapping("/dashboard-metrics/{userId}")
    public ResponseEntity<ApiResponse<DashboardService.DashboardMetrics>> getDashboardMetrics(
            @PathVariable String userId) {
        log.info("Fetching dashboard metrics for user: {}", userId);

        DashboardService.DashboardMetrics metrics = dashboardService.getDashboardMetrics(userId);

        return ResponseEntity.ok(ApiResponse.success(metrics));
    }
}
