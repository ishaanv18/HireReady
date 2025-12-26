package com.hireready.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "interview_schedules")
public class InterviewSchedule {

    @Id
    private String id;

    @Indexed
    private String userId;

    // Company and Role Information
    private String company;
    private String role;
    private String position;

    // Interview Configuration
    private String roundType; // HR, CODING, COMMUNICATION, PROBLEM_SOLVING, APTITUDE
    private String difficulty; // EASY, MEDIUM, HARD

    // Resume Information (optional)
    private String resumeId; // Reference to uploaded resume
    private String resumeText; // Extracted text from resume for AI context

    // Scheduling
    private LocalDateTime scheduledTime;
    private String status; // SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED

    // Session Information
    private String sessionId;
    private Integer questionsAsked;
    private Double averageScore;

    // Timestamps
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime completedAt;
}
