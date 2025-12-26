package com.hireready.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "interview_exchanges")
public class InterviewExchange {

    @Id
    private String id;

    private String sessionId;
    private String type; // "question" or "answer"
    private String text;
    private LocalDateTime timestamp;
    private Integer questionNumber;

    // For answers
    private Integer score; // 0-10
    private String feedback;
}
