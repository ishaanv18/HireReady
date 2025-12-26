package com.hireready.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VerifyOTPRequest {

    @NotBlank(message = "User ID is required")
    private String userId;

    @NotBlank(message = "OTP code is required")
    @Pattern(regexp = "\\d{4}", message = "OTP must be 4 digits")
    private String code;
}
