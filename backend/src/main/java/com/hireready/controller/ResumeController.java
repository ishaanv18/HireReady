package com.hireready.controller;

import com.hireready.dto.ApiResponse;
import com.hireready.model.Resume;
import com.hireready.service.ResumeService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@RestController
@RequestMapping("/api/resume")
@CrossOrigin(origins = "${cors.allowed.origins}")
public class ResumeController {

    private final ResumeService resumeService;

    public ResumeController(ResumeService resumeService) {
        this.resumeService = resumeService;
    }

    /**
     * Upload resume file
     */
    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<Resume>> uploadResume(
            @RequestParam("userId") String userId,
            @RequestParam("file") MultipartFile file) {

        log.info("Uploading resume for user: {}", userId);

        Resume resume = resumeService.uploadResume(userId, file);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Resume uploaded successfully", resume));
    }

    /**
     * Analyze existing resume by ID
     */
    @PostMapping("/analyze/{resumeId}")
    public ResponseEntity<ApiResponse<Resume>> analyzeResumeById(@PathVariable String resumeId) {
        log.info("Analyzing resume: {}", resumeId);

        Resume resume = resumeService.analyzeResumeById(resumeId);

        return ResponseEntity.ok(ApiResponse.success("Resume analyzed successfully", resume));
    }

    /**
     * Analyze uploaded resume
     */
    @PostMapping("/analyze")
    public ResponseEntity<ApiResponse<Resume>> analyzeResume(
            @RequestParam("userId") String userId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "targetRole", required = false) String targetRole) {

        log.info("Analyzing resume for user: {}", userId);

        Resume resume = resumeService.analyzeResume(userId, file, targetRole);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Resume analyzed successfully", resume));
    }

    /**
     * Get latest resume report for user
     */
    @GetMapping("/report/{userId}")
    public ResponseEntity<ApiResponse<Resume>> getResumeReport(@PathVariable String userId) {
        log.info("Fetching resume report for user: {}", userId);

        Resume resume = resumeService.getLatestResume(userId);

        if (resume == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("No resume found for this user"));
        }

        return ResponseEntity.ok(ApiResponse.success(resume));
    }

    /**
     * Get all resume history for user
     */
    @GetMapping("/history/{userId}")
    public ResponseEntity<ApiResponse<java.util.List<Resume>>> getResumeHistory(@PathVariable String userId) {
        log.info("Fetching resume history for user: {}", userId);

        java.util.List<Resume> resumes = resumeService.getAllResumes(userId);

        return ResponseEntity.ok(ApiResponse.success("Resume history retrieved successfully", resumes));
    }

    /**
     * Get resume by ID
     */
    @GetMapping("/{resumeId}")
    public ResponseEntity<ApiResponse<Resume>> getResumeById(@PathVariable String resumeId) {
        log.info("Fetching resume: {}", resumeId);

        Resume resume = resumeService.getResumeById(resumeId);

        if (resume == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Resume not found"));
        }

        return ResponseEntity.ok(ApiResponse.success(resume));
    }

    /**
     * Delete resume by ID
     */
    @DeleteMapping("/{resumeId}")
    public ResponseEntity<ApiResponse<Void>> deleteResume(@PathVariable String resumeId) {
        log.info("Deleting resume: {}", resumeId);

        resumeService.deleteResume(resumeId);

        return ResponseEntity.ok(ApiResponse.success("Resume deleted successfully", null));
    }
}
