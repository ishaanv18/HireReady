package com.hireready.service;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.reflect.TypeToken;
import com.hireready.model.InterviewSchedule;
import com.hireready.repository.InterviewScheduleRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
public class InterviewScheduleService {

    private final InterviewScheduleRepository scheduleRepository;
    private final AIService aiService;
    private final Gson gson;

    public InterviewScheduleService(InterviewScheduleRepository scheduleRepository, AIService aiService) {
        this.scheduleRepository = scheduleRepository;
        this.aiService = aiService;
        this.gson = new Gson();
    }

    /**
     * Get company suggestions
     */
    public List<String> suggestCompanies(String query) {
        try {
            String response = aiService.suggestCompanies(query);
            String cleanedResponse = cleanJsonResponse(response);
            return gson.fromJson(cleanedResponse, new TypeToken<List<String>>() {
            }.getType());
        } catch (Exception e) {
            log.error("Failed to get company suggestions", e);
            // Return default suggestions
            return List.of("Google", "Microsoft", "Amazon", "Apple", "Meta");
        }
    }

    /**
     * Get role suggestions
     */
    public List<String> suggestRoles(String query, String company) {
        try {
            String response = aiService.suggestRoles(query, company);
            String cleanedResponse = cleanJsonResponse(response);
            return gson.fromJson(cleanedResponse, new TypeToken<List<String>>() {
            }.getType());
        } catch (Exception e) {
            log.error("Failed to get role suggestions", e);
            return List.of("Software Engineer", "Data Scientist", "Product Manager", "DevOps Engineer", "QA Engineer");
        }
    }

    /**
     * Get position suggestions
     */
    public List<String> suggestPositions(String role, String company) {
        try {
            String response = aiService.suggestPositions(role, company);
            String cleanedResponse = cleanJsonResponse(response);
            return gson.fromJson(cleanedResponse, new TypeToken<List<String>>() {
            }.getType());
        } catch (Exception e) {
            log.error("Failed to get position suggestions", e);
            return List.of("Junior " + role, "Mid-Level " + role, "Senior " + role, "Lead " + role);
        }
    }

    /**
     * Schedule a new interview
     */
    public InterviewSchedule scheduleInterview(String userId, String company, String role, String position,
            String roundType, String difficulty, LocalDateTime scheduledTime) {
        InterviewSchedule schedule = new InterviewSchedule();
        schedule.setUserId(userId);
        schedule.setCompany(company);
        schedule.setRole(role);
        schedule.setPosition(position);
        schedule.setRoundType(roundType);
        schedule.setDifficulty(difficulty);
        schedule.setScheduledTime(scheduledTime);
        schedule.setStatus("SCHEDULED");
        schedule.setCreatedAt(LocalDateTime.now());
        schedule.setUpdatedAt(LocalDateTime.now());

        return scheduleRepository.save(schedule);
    }

    /**
     * Get all scheduled interviews for a user
     */
    public List<InterviewSchedule> getUserSchedules(String userId) {
        return scheduleRepository.findByUserIdOrderByScheduledTimeDesc(userId);
    }

    /**
     * Get scheduled interviews by status
     */
    public List<InterviewSchedule> getUserSchedulesByStatus(String userId, String status) {
        return scheduleRepository.findByUserIdAndStatus(userId, status);
    }

    /**
     * Update schedule status
     */
    public InterviewSchedule updateScheduleStatus(String scheduleId, String status) {
        InterviewSchedule schedule = scheduleRepository.findById(scheduleId).orElse(null);
        if (schedule != null) {
            schedule.setStatus(status);
            schedule.setUpdatedAt(LocalDateTime.now());
            if ("COMPLETED".equals(status)) {
                schedule.setCompletedAt(LocalDateTime.now());
            }
            return scheduleRepository.save(schedule);
        }
        return null;
    }

    /**
     * Check if interview can start (scheduled time has arrived)
     */
    public boolean canStartInterview(String scheduleId) {
        InterviewSchedule schedule = scheduleRepository.findById(scheduleId).orElse(null);
        if (schedule == null) {
            return false;
        }
        LocalDateTime now = LocalDateTime.now();
        // Allow starting 5 minutes before scheduled time
        return now.isAfter(schedule.getScheduledTime().minusMinutes(5));
    }

    /**
     * Clean JSON response by removing markdown code blocks
     */
    private String cleanJsonResponse(String response) {
        if (response == null) {
            return "[]";
        }
        String cleaned = response.trim();
        if (cleaned.startsWith("```json")) {
            cleaned = cleaned.substring(7);
        } else if (cleaned.startsWith("```")) {
            cleaned = cleaned.substring(3);
        }
        if (cleaned.endsWith("```")) {
            cleaned = cleaned.substring(0, cleaned.length() - 3);
        }
        return cleaned.trim();
    }

    /**
     * Delete a scheduled interview
     */
    public void deleteSchedule(String scheduleId) {
        scheduleRepository.deleteById(scheduleId);
        log.info("Deleted schedule: {}", scheduleId);
    }
}
