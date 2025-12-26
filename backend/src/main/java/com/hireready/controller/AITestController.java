package com.hireready.controller;

import com.hireready.service.AIService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/test")
public class AITestController {

    private final AIService aiService;

    public AITestController(AIService aiService) {
        this.aiService = aiService;
    }

    @GetMapping("/groq")
    public ResponseEntity<Map<String, Object>> testGroq() {
        Map<String, Object> response = new HashMap<>();
        try {
            log.info("Testing Groq API...");
            String result = aiService.generateResponse("Say 'Hello, Groq is working!' in one sentence.");
            response.put("success", true);
            response.put("message", "Groq API is working!");
            response.put("response", result);
            log.info("Groq API test successful: {}", result);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Groq API test failed", e);
            response.put("success", false);
            response.put("message", "Groq API failed");
            response.put("error", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    @GetMapping("/interview-question")
    public ResponseEntity<Map<String, Object>> testInterviewQuestion() {
        Map<String, Object> response = new HashMap<>();
        try {
            log.info("Testing interview question generation...");
            String question = aiService.generateInterviewQuestion(
                    "Google",
                    "Software Engineer",
                    "CODING",
                    "MEDIUM",
                    1,
                    "");
            response.put("success", true);
            response.put("message", "Question generated successfully!");
            response.put("question", question);
            log.info("Generated question: {}", question);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Question generation failed", e);
            response.put("success", false);
            response.put("message", "Question generation failed");
            response.put("error", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
}
