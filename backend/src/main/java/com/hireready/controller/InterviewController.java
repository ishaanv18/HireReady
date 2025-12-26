package com.hireready.controller;

import com.hireready.dto.ApiResponse;
import com.hireready.dto.InterviewAnswerRequest;
import com.hireready.dto.InterviewStartRequest;
import com.hireready.model.InterviewSession;
import com.hireready.service.InterviewService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/interview")
@CrossOrigin(origins = "${cors.allowed.origins}")
public class InterviewController {

    private final InterviewService interviewService;

    public InterviewController(InterviewService interviewService) {
        this.interviewService = interviewService;
    }

    /**
     * Start a new interview session
     */
    @PostMapping("/start")
    public ResponseEntity<ApiResponse<InterviewSession>> startInterview(
            @Valid @RequestBody InterviewStartRequest request) {
        log.info("Starting {} interview for user: {}", request.getRole(), request.getUserId());

        InterviewSession session = interviewService.startInterview(
                request.getUserId(),
                request.getRole(),
                request.getMode());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Interview started successfully", session));
    }

    /**
     * Submit answer and get next question
     */
    @PostMapping("/submit-answer")
    public ResponseEntity<ApiResponse<InterviewSession>> submitAnswer(
            @Valid @RequestBody InterviewAnswerRequest request) {
        log.info("Submitting answer for session: {}", request.getSessionId());

        InterviewSession session = interviewService.submitAnswer(request.getSessionId(), request.getAnswer());

        return ResponseEntity.ok(ApiResponse.success("Answer submitted successfully", session));
    }

    /**
     * Complete interview manually
     */
    @PostMapping("/complete/{sessionId}")
    public ResponseEntity<ApiResponse<InterviewSession>> completeInterview(@PathVariable String sessionId) {
        log.info("Completing interview session: {}", sessionId);

        InterviewSession session = interviewService.completeInterview(sessionId);

        return ResponseEntity.ok(ApiResponse.success("Interview completed successfully", session));
    }

    /**
     * Get interview history for user
     */
    @GetMapping("/history/{userId}")
    public ResponseEntity<ApiResponse<List<InterviewSession>>> getInterviewHistory(@PathVariable String userId) {
        log.info("Fetching interview history for user: {}", userId);

        List<InterviewSession> history = interviewService.getInterviewHistory(userId);

        return ResponseEntity.ok(ApiResponse.success(history));
    }

    /**
     * Get specific interview session
     */
    @GetMapping("/session/{sessionId}")
    public ResponseEntity<ApiResponse<InterviewSession>> getSession(@PathVariable String sessionId) {
        log.info("Fetching interview session: {}", sessionId);

        InterviewSession session = interviewService.getSession(sessionId);

        if (session == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Interview session not found"));
        }

        return ResponseEntity.ok(ApiResponse.success(session));
    }

    /**
     * Get active session for user
     */
    @GetMapping("/active/{userId}")
    public ResponseEntity<ApiResponse<InterviewSession>> getActiveSession(@PathVariable String userId) {
        log.info("Fetching active session for user: {}", userId);

        InterviewSession session = interviewService.getActiveSession(userId);

        if (session == null) {
            return ResponseEntity.ok(ApiResponse.success("No active session", null));
        }

        return ResponseEntity.ok(ApiResponse.success(session));
    }
}
