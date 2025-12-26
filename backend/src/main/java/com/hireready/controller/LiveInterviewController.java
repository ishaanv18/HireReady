package com.hireready.controller;

import com.hireready.dto.ApiResponse;
import com.hireready.model.InterviewEvaluation;
import com.hireready.model.InterviewSession;
import com.hireready.service.LiveInterviewService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/interview/live")
@CrossOrigin(origins = "${cors.allowed.origins}")
public class LiveInterviewController {

    private final LiveInterviewService liveInterviewService;

    public LiveInterviewController(LiveInterviewService liveInterviewService) {
        this.liveInterviewService = liveInterviewService;
    }

    /**
     * Start a live interview from a schedule
     */
    @PostMapping("/start")
    public ResponseEntity<ApiResponse<InterviewSession>> startLiveInterview(@RequestParam String scheduleId) {
        log.info("Starting live interview for schedule: {}", scheduleId);

        try {
            InterviewSession session = liveInterviewService.startLiveInterview(scheduleId);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Live interview started successfully", session));
        } catch (Exception e) {
            log.error("Failed to start live interview", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to start interview: " + e.getMessage()));
        }
    }

    /**
     * Get next interview question
     */
    @PostMapping("/next-question")
    public ResponseEntity<ApiResponse<String>> getNextQuestion(
            @RequestParam String sessionId,
            @RequestParam(required = false) String previousAnswer) {

        log.info("Getting next question for session: {}", sessionId);

        try {
            String question = liveInterviewService.getNextQuestion(sessionId, previousAnswer);
            return ResponseEntity.ok(ApiResponse.success("Question generated successfully", question));
        } catch (Exception e) {
            log.error("Failed to generate question", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to generate question: " + e.getMessage()));
        }
    }

    /**
     * End interview and get final evaluation
     */
    @PostMapping("/end")
    public ResponseEntity<ApiResponse<InterviewEvaluation>> endInterview(@RequestParam String sessionId) {
        log.info("Ending interview session: {}", sessionId);

        try {
            InterviewEvaluation evaluation = liveInterviewService.endInterview(sessionId);
            return ResponseEntity.ok(ApiResponse.success("Interview completed successfully", evaluation));
        } catch (Exception e) {
            log.error("Failed to end interview", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to complete interview: " + e.getMessage()));
        }
    }

    /**
     * Get evaluation report for a completed interview
     */
    @GetMapping("/report/{sessionId}")
    public ResponseEntity<ApiResponse<InterviewEvaluation>> getEvaluationReport(@PathVariable String sessionId) {
        log.info("Fetching evaluation report for session: {}", sessionId);

        try {
            InterviewEvaluation evaluation = liveInterviewService.getEvaluationReport(sessionId);
            return ResponseEntity.ok(ApiResponse.success(evaluation));
        } catch (Exception e) {
            log.error("Failed to fetch evaluation report", e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Evaluation not found: " + e.getMessage()));
        }
    }

    /**
     * Delete an interview evaluation
     */
    @DeleteMapping("/evaluation/{sessionId}")
    public ResponseEntity<ApiResponse<Void>> deleteEvaluation(@PathVariable String sessionId) {
        log.info("Deleting evaluation for session: {}", sessionId);

        try {
            liveInterviewService.deleteEvaluation(sessionId);
            return ResponseEntity.ok(ApiResponse.success("Evaluation deleted successfully", null));
        } catch (Exception e) {
            log.error("Failed to delete evaluation", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to delete evaluation: " + e.getMessage()));
        }
    }
}
