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
@Document(collection = "otps")
public class OTP {

    @Id
    private String id;

    @Indexed
    private String userId;

    private String email;

    private String code; // 4-digit code

    private LocalDateTime expiresAt; // 5 minutes from creation

    private Integer attemptCount = 0; // Max 3 attempts

    private LocalDateTime lastResendAt; // For 60-second cooldown

    private Boolean verified = false;

    private LocalDateTime createdAt;

    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }

    public boolean hasExceededAttempts() {
        return attemptCount >= 3;
    }

    public boolean canResend() {
        if (lastResendAt == null) {
            return true;
        }
        return LocalDateTime.now().isAfter(lastResendAt.plusSeconds(60));
    }
}
