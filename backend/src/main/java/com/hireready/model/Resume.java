package com.hireready.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "resumes")
public class Resume {

    @Id
    private String id;

    @Indexed
    private String userId;

    // File information
    private String fileName;
    private String fileType; // PDF, IMAGE, TEXT
    private String originalText;

    // Parsed data
    private List<String> skills;
    private List<Project> projects;
    private List<Education> educations;
    private List<String> achievements;
    private List<Experience> experiences;

    // Analysis results
    private Double atsScore;
    private Map<String, Object> skillGapAnalysis;
    private List<String> weaknesses;
    private List<String> recommendations;
    private List<String> improvedBulletPoints;
    private List<String> atsKeywords;

    // Timestamps
    private LocalDateTime analyzedAt;
    private LocalDateTime createdAt;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Project {
        private String name;
        private String description;
        private List<String> technologies;
        private String duration;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Education {
        private String institution;
        private String degree;
        private String field;
        private String duration;
        private String grade;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Experience {
        private String company;
        private String position;
        private String duration;
        private List<String> responsibilities;
    }
}
