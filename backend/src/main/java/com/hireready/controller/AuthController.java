package com.hireready.controller;

import com.hireready.dto.*;
import com.hireready.exception.UserAlreadyExistsException;
import com.hireready.model.User;
import com.hireready.repository.UserRepository;
import com.hireready.service.EmailService;
import com.hireready.service.OTPService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "${cors.allowed.origins}")
public class AuthController {

    private final UserRepository userRepository;
    private final OTPService otpService;
    private final EmailService emailService;

    public AuthController(UserRepository userRepository, OTPService otpService, EmailService emailService) {
        this.userRepository = userRepository;
        this.otpService = otpService;
        this.emailService = emailService;
    }

    /**
     * Register extra user data after Clerk signup
     */
    @PostMapping("/register-extra-data")
    public ResponseEntity<ApiResponse<User>> registerExtraData(@Valid @RequestBody RegisterExtraDataRequest request) {
        log.info("Registering extra data for Clerk user: {}", request.getClerkUserId());

        // Check if user already exists
        if (userRepository.existsByClerkUserId(request.getClerkUserId())) {
            throw new UserAlreadyExistsException("User already registered");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new UserAlreadyExistsException("Email already registered");
        }

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new UserAlreadyExistsException("Username already taken");
        }

        // Create user
        User user = new User();
        user.setClerkUserId(request.getClerkUserId());
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPrivacyPolicyAccepted(request.getPrivacyPolicyAccepted());
        user.setTermsAccepted(request.getTermsAccepted());
        user.setAiUsageConsentAccepted(request.getAiUsageConsentAccepted());
        user.setEmailVerified(false);
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());

        User savedUser = userRepository.save(user);

        log.info("User registered successfully: {}", savedUser.getId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("User registered successfully. Please verify your email.", savedUser));
    }

    /**
     * Send OTP for email verification
     */
    @PostMapping("/send-otp")
    public ResponseEntity<ApiResponse<String>> sendOTP(@Valid @RequestBody SendOTPRequest request) {
        log.info("Sending OTP to user: {}", request.getUserId());

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getEmailVerified()) {
            return ResponseEntity.ok(ApiResponse.error("Email already verified"));
        }

        otpService.generateAndSendOTP(user.getId(), user.getEmail(), user.getUsername());

        return ResponseEntity.ok(ApiResponse.success("OTP sent to your email"));
    }

    /**
     * Verify OTP
     */
    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse<User>> verifyOTP(@Valid @RequestBody VerifyOTPRequest request) {
        log.info("Verifying OTP for user: {}", request.getUserId());

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        boolean verified = otpService.verifyOTP(request.getUserId(), request.getCode());

        if (verified) {
            user.setEmailVerified(true);
            user.setUpdatedAt(LocalDateTime.now());
            userRepository.save(user);

            // Send welcome email
            emailService.sendWelcomeEmail(user.getEmail(), user.getUsername());

            return ResponseEntity.ok(ApiResponse.success("Email verified successfully", user));
        }

        return ResponseEntity.badRequest().body(ApiResponse.error("OTP verification failed"));
    }

    /**
     * Login - validate Clerk user and return user data
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<User>> login(@Valid @RequestBody LoginRequest request) {
        log.info("Login request for Clerk user: {}", request.getClerkUserId());

        User user = userRepository.findByClerkUserId(request.getClerkUserId())
                .orElseThrow(() -> new RuntimeException("User not found. Please register first."));

        if (!user.getEmailVerified()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Email not verified. Please verify your email first."));
        }

        return ResponseEntity.ok(ApiResponse.success("Login successful", user));
    }
}
