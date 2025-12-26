package com.hireready.controller;

import com.hireready.model.InterviewEvaluation;
import com.hireready.repository.InterviewEvaluationRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final InterviewEvaluationRepository evaluationRepository;

    public AnalyticsController(InterviewEvaluationRepository evaluationRepository) {
        this.evaluationRepository = evaluationRepository;
    }

    @GetMapping("/interviews/{userId}")
    public ResponseEntity<Map<String, Object>> getUserInterviewAnalytics(@PathVariable String userId) {
        try {
            log.info("Fetching interview analytics for user: {}", userId);

            List<InterviewEvaluation> evaluations = evaluationRepository.findByUserId(userId);

            // Calculate statistics
            long totalInterviews = evaluations.size();
            long selectedCount = evaluations.stream()
                    .filter(e -> "SELECTED".equals(e.getDecision()))
                    .count();
            long rejectedCount = evaluations.stream()
                    .filter(e -> "REJECTED".equals(e.getDecision()))
                    .count();
            long waitlistedCount = evaluations.stream()
                    .filter(e -> "WAITLISTED".equals(e.getDecision()))
                    .count();

            double averageScore = evaluations.stream()
                    .mapToInt(InterviewEvaluation::getOverallScore)
                    .average()
                    .orElse(0.0);

            Map<String, Object> analytics = new HashMap<>();
            analytics.put("totalInterviews", totalInterviews);
            analytics.put("selectedCount", selectedCount);
            analytics.put("rejectedCount", rejectedCount);
            analytics.put("waitlistedCount", waitlistedCount);
            analytics.put("averageScore", Math.round(averageScore * 10.0) / 10.0);
            analytics.put("successRate",
                    totalInterviews > 0 ? Math.round((selectedCount * 100.0 / totalInterviews) * 10.0) / 10.0 : 0.0);
            analytics.put("interviews", evaluations);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", analytics);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to fetch analytics for user: {}", userId, e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Failed to fetch analytics");
            return ResponseEntity.status(500).body(response);
        }
    }
}
