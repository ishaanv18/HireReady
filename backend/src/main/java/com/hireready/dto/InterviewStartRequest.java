package com.hireready.dto;

import com.hireready.model.InterviewSession;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InterviewStartRequest {

    @NotBlank(message = "User ID is required")
    private String userId;

    @NotNull(message = "Interview role is required")
    private InterviewSession.InterviewRole role;

    @NotNull(message = "Interview mode is required")
    private InterviewSession.InterviewMode mode;
}
