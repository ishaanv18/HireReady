package com.hireready.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "interview_sessions")
public class InterviewSession {

    @Id
    private String id;

    @Indexed
    private String userId;

    // Interview configuration
    private InterviewRole role; // SDE, DATA_ANALYST, HR, SYSTEM_DESIGN
    private InterviewMode mode; // TEXT, VOICE

    // Session data
    private List<QuestionAnswer> questionAnswers = new ArrayList<>();
    private Integer currentDifficultyLevel = 1; // 1-5 scale

    // Scoring
    private Double technicalScore = 0.0;
    private Double communicationScore = 0.0;
    private Double confidenceScore = 0.0;
    private Double emotionStabilityScore = 0.0;
    private Double overallReadiness = 0.0;

    // Feedback
    private String detailedFeedback;
    private List<String> strengths;
    private List<String> improvements;

    // Session status
    private SessionStatus status; // IN_PROGRESS, COMPLETED, ABANDONED

    // Timestamps
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;

    public enum InterviewRole {
        SDE, DATA_ANALYST, HR, SYSTEM_DESIGN
    }

    public enum InterviewMode {
        TEXT, VOICE
    }

    public enum SessionStatus {
        IN_PROGRESS, COMPLETED, ABANDONED
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuestionAnswer {
        private String question;
        private String answer;
        private Integer difficultyLevel;
        private Double score;
        private String feedback;
        private SentimentAnalysis sentiment;
        private LocalDateTime answeredAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SentimentAnalysis {
        private String overallSentiment; // POSITIVE, NEUTRAL, NEGATIVE
        private Double confidenceLevel; // 0-1
        private Integer fillerWordCount;
        private List<String> detectedEmotions;
    }
}
