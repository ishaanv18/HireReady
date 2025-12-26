package com.hireready.controller;

import com.hireready.dto.ApiResponse;
import com.hireready.model.InterviewSchedule;
import com.hireready.service.InterviewScheduleService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/interview")
@CrossOrigin(origins = "${cors.allowed.origins}")
public class InterviewScheduleController {

    private final InterviewScheduleService scheduleService;

    public InterviewScheduleController(InterviewScheduleService scheduleService) {
        this.scheduleService = scheduleService;
    }

    /**
     * Get company suggestions based on query
     */
    @GetMapping("/suggest-companies")
    public ResponseEntity<ApiResponse<List<String>>> suggestCompanies(@RequestParam String query) {
        log.info("Getting company suggestions for query: {}", query);
        List<String> suggestions = scheduleService.suggestCompanies(query);
        return ResponseEntity.ok(ApiResponse.success(suggestions));
    }

    /**
     * Get role suggestions based on query and company
     */
    @GetMapping("/suggest-roles")
    public ResponseEntity<ApiResponse<List<String>>> suggestRoles(
            @RequestParam String query,
            @RequestParam(required = false) String company) {
        log.info("Getting role suggestions for query: {}, company: {}", query, company);
        List<String> suggestions = scheduleService.suggestRoles(query, company);
        return ResponseEntity.ok(ApiResponse.success(suggestions));
    }

    /**
     * Get position suggestions based on role and company
     */
    @GetMapping("/suggest-positions")
    public ResponseEntity<ApiResponse<List<String>>> suggestPositions(
            @RequestParam String role,
            @RequestParam(required = false) String company) {
        log.info("Getting position suggestions for role: {}, company: {}", role, company);
        List<String> suggestions = scheduleService.suggestPositions(role, company);
        return ResponseEntity.ok(ApiResponse.success(suggestions));
    }

    /**
     * Schedule a new interview
     */
    @PostMapping("/schedule")
    public ResponseEntity<ApiResponse<InterviewSchedule>> scheduleInterview(
            @RequestParam String userId,
            @RequestParam String company,
            @RequestParam String role,
            @RequestParam String position,
            @RequestParam String roundType,
            @RequestParam String difficulty,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime scheduledTime) {

        log.info("Scheduling interview for user: {}, company: {}, role: {}", userId, company, role);

        InterviewSchedule schedule = scheduleService.scheduleInterview(
                userId, company, role, position, roundType, difficulty, scheduledTime);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Interview scheduled successfully", schedule));
    }

    /**
     * Get all scheduled interviews for a user
     */
    @GetMapping("/schedules/{userId}")
    public ResponseEntity<ApiResponse<List<InterviewSchedule>>> getUserSchedules(@PathVariable String userId) {
        log.info("Fetching schedules for user: {}", userId);
        List<InterviewSchedule> schedules = scheduleService.getUserSchedules(userId);
        return ResponseEntity.ok(ApiResponse.success(schedules));
    }

    /**
     * Get scheduled interviews by status
     */
    @GetMapping("/schedules/{userId}/status/{status}")
    public ResponseEntity<ApiResponse<List<InterviewSchedule>>> getUserSchedulesByStatus(
            @PathVariable String userId,
            @PathVariable String status) {
        log.info("Fetching {} schedules for user: {}", status, userId);
        List<InterviewSchedule> schedules = scheduleService.getUserSchedulesByStatus(userId, status);
        return ResponseEntity.ok(ApiResponse.success(schedules));
    }

    /**
     * Check if interview can start
     */
    @GetMapping("/can-start/{scheduleId}")
    public ResponseEntity<ApiResponse<Boolean>> canStartInterview(@PathVariable String scheduleId) {
        log.info("Checking if interview can start: {}", scheduleId);
        boolean canStart = scheduleService.canStartInterview(scheduleId);
        return ResponseEntity.ok(ApiResponse.success(canStart));
    }

    /**
     * Update schedule status
     */
    @PutMapping("/schedule/{scheduleId}/status")
    public ResponseEntity<ApiResponse<InterviewSchedule>> updateScheduleStatus(
            @PathVariable String scheduleId,
            @RequestParam String status) {
        log.info("Updating schedule {} to status: {}", scheduleId, status);
        InterviewSchedule schedule = scheduleService.updateScheduleStatus(scheduleId, status);

        if (schedule == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Schedule not found"));
        }

        return ResponseEntity.ok(ApiResponse.success("Schedule updated successfully", schedule));
    }

    /**
     * Delete a scheduled interview
     */
    @DeleteMapping("/schedule/{scheduleId}")
    public ResponseEntity<ApiResponse<Void>> deleteSchedule(@PathVariable String scheduleId) {
        log.info("Deleting schedule: {}", scheduleId);
        scheduleService.deleteSchedule(scheduleId);
        return ResponseEntity.ok(ApiResponse.success("Interview deleted successfully", null));
    }
}
