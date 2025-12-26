package com.hireready.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.from}")
    private String fromEmail;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    /**
     * Send OTP verification email
     */
    public void sendOTPEmail(String toEmail, String otp, String username) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("HireReady - Email Verification OTP");
            message.setText(buildOTPEmailBody(username, otp));

            mailSender.send(message);
            log.info("OTP email sent successfully to: {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send OTP email to: {}", toEmail, e);
            throw new RuntimeException("Failed to send OTP email", e);
        }
    }

    /**
     * Build OTP email body
     */
    private String buildOTPEmailBody(String username, String otp) {
        return String.format("""
                Hello %s,

                Welcome to HireReady - Your AI Interview Simulator & Resume Analyzer!

                Your email verification code is: %s

                This code will expire in 5 minutes.

                If you didn't request this code, please ignore this email.

                Best regards,
                The HireReady Team
                """, username, otp);
    }

    /**
     * Send welcome email after successful verification
     */
    public void sendWelcomeEmail(String toEmail, String username) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Welcome to HireReady!");
            message.setText(buildWelcomeEmailBody(username));

            mailSender.send(message);
            log.info("Welcome email sent successfully to: {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send welcome email to: {}", toEmail, e);
            // Don't throw exception for welcome email failure
        }
    }

    /**
     * Build welcome email body
     */
    private String buildWelcomeEmailBody(String username) {
        return String.format("""
                Hello %s,

                Your email has been verified successfully!

                You can now access all features of HireReady:
                - AI-powered Resume Analysis with ATS scoring
                - Interactive Interview Simulator
                - Personalized feedback and recommendations
                - Track your progress with detailed analytics

                Get started by uploading your resume or starting your first mock interview!

                Best regards,
                The HireReady Team
                """, username);
    }
}
