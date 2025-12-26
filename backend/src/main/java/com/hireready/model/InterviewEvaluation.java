package com.hireready.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "interview_evaluations")
public class InterviewEvaluation {

    @Id
    private String id;

    private String sessionId;
    private String userId;

    // Overall Results
    private Integer overallScore; // 0-100
    private String decision; // SELECTED, REJECTED, WAITLISTED

    // Detailed Feedback
    private List<String> strengths;
    private List<String> weaknesses;
    private List<String> improvements;
    private String detailedFeedback;

    // Question Scores
    private List<QuestionScore> questionScores;

    // Metadata
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuestionScore {
        private String question;
        private String answer;
        private Integer score; // 0-10
        private String feedback;
    }
}
