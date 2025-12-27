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
            List<String> suggestions = parseStringList(response);
            // Return default suggestions if parsing failed or empty
            if (suggestions.isEmpty()) {
                return List.of("Google", "Microsoft", "Amazon", "Apple", "Meta");
            }
            return suggestions;
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
            List<String> suggestions = parseStringList(response);
            // Return default suggestions if parsing failed or empty
            if (suggestions.isEmpty()) {
                return List.of("Software Engineer", "Data Scientist", "Product Manager", "DevOps Engineer",
                        "QA Engineer");
            }
            return suggestions;
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
            List<String> suggestions = parseStringList(response);
            // Return default suggestions if parsing failed or empty
            if (suggestions.isEmpty()) {
                return List.of("Junior " + role, "Mid-Level " + role, "Senior " + role, "Lead " + role);
            }
            return suggestions;
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
     * Parse AI response to List<String>, handling both string arrays and object
     * arrays
     */
    private List<String> parseStringList(String response) {
        try {
            String cleanedResponse = cleanJsonResponse(response);

            // Try parsing as JsonArray first to handle both cases
            JsonArray jsonArray = gson.fromJson(cleanedResponse, JsonArray.class);
            List<String> result = new java.util.ArrayList<>();

            for (int i = 0; i < jsonArray.size(); i++) {
                if (jsonArray.get(i).isJsonPrimitive()) {
                    // It's a string - add directly
                    result.add(jsonArray.get(i).getAsString());
                } else if (jsonArray.get(i).isJsonObject()) {
                    // It's an object - try to extract a string value
                    // Common patterns: {"name": "..."}, {"value": "..."}, {"company": "..."}
                    var obj = jsonArray.get(i).getAsJsonObject();
                    String value = null;

                    // Try common field names
                    if (obj.has("name")) {
                        value = obj.get("name").getAsString();
                    } else if (obj.has("value")) {
                        value = obj.get("value").getAsString();
                    } else if (obj.has("company")) {
                        value = obj.get("company").getAsString();
                    } else if (obj.has("role")) {
                        value = obj.get("role").getAsString();
                    } else if (obj.has("position")) {
                        value = obj.get("position").getAsString();
                    } else {
                        // If no known field, take the first string value found
                        for (String key : obj.keySet()) {
                            if (obj.get(key).isJsonPrimitive()) {
                                value = obj.get(key).getAsString();
                                break;
                            }
                        }
                    }

                    if (value != null) {
                        result.add(value);
                    }
                }
            }

            return result;
        } catch (Exception e) {
            log.error("Failed to parse AI response as string list: {}", response, e);
            return new java.util.ArrayList<>();
        }
    }

    /**
     * Delete a scheduled interview
     */
    public void deleteSchedule(String scheduleId) {
        scheduleRepository.deleteById(scheduleId);
        log.info("Deleted schedule: {}", scheduleId);
    }
}
