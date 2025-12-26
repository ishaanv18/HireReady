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
@Document(collection = "users")
public class User {

    @Id
    private String id;

    @Indexed(unique = true)
    private String clerkUserId;

    @Indexed(unique = true)
    private String username;

    @Indexed(unique = true)
    private String email;

    // Consent flags
    private Boolean privacyPolicyAccepted;
    private Boolean termsAccepted;
    private Boolean aiUsageConsentAccepted;

    // Verification status
    private Boolean emailVerified = false;

    // Profile metrics
    private Double profileScore = 0.0;
    private Double atsScore = 0.0;
    private Double interviewReadiness = 0.0;

    // Timestamps
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Resume reference
    private String currentResumeId;
}
