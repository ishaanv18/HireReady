package com.hireready.service;

import com.hireready.exception.OTPException;
import com.hireready.model.OTP;
import com.hireready.repository.OTPRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Random;

@Slf4j
@Service
public class OTPService {

    private final OTPRepository otpRepository;
    private final EmailService emailService;

    @Value("${otp.expiration.minutes:5}")
    private int otpExpirationMinutes;

    @Value("${otp.max.attempts:3}")
    private int maxAttempts;

    @Value("${otp.resend.cooldown.seconds:60}")
    private int resendCooldownSeconds;

    public OTPService(OTPRepository otpRepository, EmailService emailService) {
        this.otpRepository = otpRepository;
        this.emailService = emailService;
    }

    /**
     * Generate and send OTP
     */
    @Transactional
    public void generateAndSendOTP(String userId, String email, String username) {
        // Check for existing OTP
        otpRepository.findByUserIdAndVerifiedFalse(userId).ifPresent(existingOTP -> {
            if (!existingOTP.canResend()) {
                throw new OTPException("Please wait " + resendCooldownSeconds + " seconds before requesting a new OTP");
            }
            // Delete old OTP
            otpRepository.delete(existingOTP);
        });

        // Generate 4-digit OTP
        String code = generateOTPCode();

        // Create OTP entity
        OTP otp = new OTP();
        otp.setUserId(userId);
        otp.setEmail(email);
        otp.setCode(code);
        otp.setExpiresAt(LocalDateTime.now().plusMinutes(otpExpirationMinutes));
        otp.setAttemptCount(0);
        otp.setLastResendAt(LocalDateTime.now());
        otp.setVerified(false);
        otp.setCreatedAt(LocalDateTime.now());

        otpRepository.save(otp);

        // Send email
        emailService.sendOTPEmail(email, code, username);

        log.info("OTP generated and sent to user: {}", userId);
    }

    /**
     * Verify OTP
     */
    @Transactional
    public boolean verifyOTP(String userId, String code) {
        OTP otp = otpRepository.findByUserIdAndVerifiedFalse(userId)
                .orElseThrow(() -> new OTPException("No pending OTP found for this user"));

        // Check if expired
        if (otp.isExpired()) {
            otpRepository.delete(otp);
            throw new OTPException("OTP has expired. Please request a new one");
        }

        // Check if max attempts exceeded
        if (otp.hasExceededAttempts()) {
            otpRepository.delete(otp);
            throw new OTPException("Maximum verification attempts exceeded. Please request a new OTP");
        }

        // Increment attempt count
        otp.setAttemptCount(otp.getAttemptCount() + 1);
        otpRepository.save(otp);

        // Verify code
        if (!otp.getCode().equals(code)) {
            int remainingAttempts = maxAttempts - otp.getAttemptCount();
            if (remainingAttempts > 0) {
                throw new OTPException("Invalid OTP. " + remainingAttempts + " attempts remaining");
            } else {
                otpRepository.delete(otp);
                throw new OTPException("Invalid OTP. Maximum attempts exceeded");
            }
        }

        // Mark as verified
        otp.setVerified(true);
        otpRepository.save(otp);

        log.info("OTP verified successfully for user: {}", userId);
        return true;
    }

    /**
     * Generate random 4-digit OTP code
     */
    private String generateOTPCode() {
        Random random = new Random();
        int code = 1000 + random.nextInt(9000); // Generates 1000-9999
        return String.valueOf(code);
    }

    /**
     * Check if user has verified OTP
     */
    public boolean isOTPVerified(String userId) {
        return otpRepository.findByUserIdAndVerifiedFalse(userId).isEmpty();
    }

    /**
     * Clean up expired OTPs (can be scheduled)
     */
    @Transactional
    public void cleanupExpiredOTPs() {
        // This can be implemented with a scheduled task
        log.info("Cleaning up expired OTPs");
    }
}
