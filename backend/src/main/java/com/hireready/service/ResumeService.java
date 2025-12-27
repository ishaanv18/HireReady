package com.hireready.service;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonSyntaxException;
import com.google.gson.reflect.TypeToken;
import com.hireready.exception.InvalidFileException;
import com.hireready.model.Resume;
import com.hireready.model.User;
import com.hireready.repository.ResumeRepository;
import com.hireready.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class ResumeService {

    private final ResumeRepository resumeRepository;
    private final UserRepository userRepository;
    private final AIService aiService;
    private final OCRService ocrService;
    private final Gson gson;

    public ResumeService(ResumeRepository resumeRepository, UserRepository userRepository,
            AIService aiService, OCRService ocrService) {
        this.resumeRepository = resumeRepository;
        this.userRepository = userRepository;
        this.aiService = aiService;
        this.ocrService = ocrService;
        this.gson = new Gson();
    }

    /**
     * Analyze resume from uploaded file
     */
    @Transactional
    public Resume analyzeResume(String userId, MultipartFile file, String targetRole) {
        log.info("Starting resume analysis for user: {}", userId);

        // Validate file
        if (file.isEmpty()) {
            throw new InvalidFileException("File is empty");
        }

        String contentType = file.getContentType();
        String fileName = file.getOriginalFilename();
        String extractedText;
        String fileType;

        try {
            // Extract text based on file type
            if (contentType != null && contentType.equals("application/pdf")) {
                extractedText = extractTextFromPDF(file);
                fileType = "PDF";
            } else if (ocrService.isImageFile(contentType)) {
                extractedText = ocrService.extractTextFromImage(file);
                fileType = "IMAGE";
            } else if (contentType != null && contentType.startsWith("text/")) {
                extractedText = new String(file.getBytes());
                fileType = "TEXT";
            } else {
                throw new InvalidFileException("Unsupported file type. Please upload PDF, Image, or Text file");
            }

            if (extractedText == null || extractedText.trim().isEmpty()) {
                throw new InvalidFileException("Could not extract text from file");
            }

            log.info("Extracted {} characters from resume", extractedText.length());

            // Parse resume using AI
            String parseResult = aiService.parseResume(extractedText);
            String cleanedParseResult = cleanJsonResponse(parseResult);
            JsonObject parsedData = gson.fromJson(cleanedParseResult, JsonObject.class);

            // Analyze for ATS
            String atsResult = aiService.analyzeResumeForATS(extractedText,
                    targetRole != null ? targetRole : "Software Developer");
            String cleanedAtsResult = cleanJsonResponse(atsResult);
            JsonObject atsData = gson.fromJson(cleanedAtsResult, JsonObject.class);

            // Create Resume entity
            Resume resume = new Resume();
            resume.setUserId(userId);
            resume.setFileName(fileName);
            resume.setFileType(fileType);
            resume.setOriginalText(extractedText);

            // Set parsed data with error handling
            try {
                resume.setSkills(parseStringList(parsedData.get("skills")));
            } catch (Exception e) {
                log.warn("Failed to parse skills, using empty list", e);
                resume.setSkills(List.of());
            }

            try {
                resume.setProjects(gson.fromJson(parsedData.get("projects"), new TypeToken<List<Resume.Project>>() {
                }.getType()));
            } catch (Exception e) {
                log.warn("Failed to parse projects, using empty list", e);
                resume.setProjects(List.of());
            }

            try {
                resume.setEducations(
                        gson.fromJson(parsedData.get("education"), new TypeToken<List<Resume.Education>>() {
                        }.getType()));
            } catch (Exception e) {
                log.warn("Failed to parse education, using empty list", e);
                resume.setEducations(List.of());
            }

            try {
                resume.setAchievements(parseStringList(parsedData.get("achievements")));
            } catch (Exception e) {
                log.warn("Failed to parse achievements, using empty list", e);
                resume.setAchievements(List.of());
            }

            try {
                resume.setExperiences(
                        gson.fromJson(parsedData.get("experience"), new TypeToken<List<Resume.Experience>>() {
                        }.getType()));
            } catch (Exception e) {
                log.warn("Failed to parse experience, using empty list", e);
                resume.setExperiences(List.of());
            }

            // Set ATS analysis with error handling
            try {
                resume.setAtsScore(atsData.get("atsScore").getAsDouble());
            } catch (Exception e) {
                log.warn("Failed to parse ATS score, using default 0", e);
                resume.setAtsScore(0.0);
            }

            try {
                resume.setSkillGapAnalysis(
                        gson.fromJson(atsData.get("skillGapAnalysis"), new TypeToken<Map<String, Object>>() {
                        }.getType()));
            } catch (Exception e) {
                log.warn("Failed to parse skill gap analysis", e);
                resume.setSkillGapAnalysis(Map.of());
            }

            try {
                resume.setWeaknesses(parseStringList(atsData.get("weaknesses")));
            } catch (Exception e) {
                log.warn("Failed to parse weaknesses, using empty list", e);
                resume.setWeaknesses(List.of());
            }

            try {
                resume.setRecommendations(parseStringList(atsData.get("recommendations")));
            } catch (Exception e) {
                log.warn("Failed to parse recommendations, using empty list", e);
                resume.setRecommendations(List.of());
            }

            try {
                resume.setImprovedBulletPoints(parseStringList(atsData.get("improvedBulletPoints")));
            } catch (Exception e) {
                log.warn("Failed to parse improved bullet points, using empty list", e);
                resume.setImprovedBulletPoints(List.of());
            }

            try {
                resume.setAtsKeywords(parseStringList(atsData.get("atsKeywords")));
            } catch (Exception e) {
                log.warn("Failed to parse ATS keywords, using empty list", e);
                resume.setAtsKeywords(List.of());
            }

            resume.setAnalyzedAt(LocalDateTime.now());
            resume.setCreatedAt(LocalDateTime.now());

            // Save resume
            Resume savedResume = resumeRepository.save(resume);

            // Update user's ATS score and current resume
            User user = userRepository.findById(userId).orElseThrow();
            user.setAtsScore(resume.getAtsScore());
            user.setCurrentResumeId(savedResume.getId());
            user.setUpdatedAt(LocalDateTime.now());
            userRepository.save(user);

            log.info("Resume analysis completed for user: {}", userId);
            return savedResume;

        } catch (IOException e) {
            log.error("Failed to process resume file", e);
            throw new InvalidFileException("Failed to process resume file: " + e.getMessage());
        } catch (JsonSyntaxException e) {
            log.error("Failed to parse AI response", e);
            throw new RuntimeException("Failed to parse resume data from AI", e);
        }
    }

    /**
     * Clean JSON response by removing markdown code blocks if present
     */
    private String cleanJsonResponse(String response) {
        if (response == null) {
            return null;
        }

        // Remove markdown code blocks
        String cleaned = response.trim();
        if (cleaned.startsWith("```json")) {
            cleaned = cleaned.substring(7);
        } else if (cleaned.startsWith("```")) {
            cleaned = cleaned.substring(3);
        }

        if (cleaned.endsWith("```")) {
            cleaned = cleaned.substring(0, cleaned.length() - 3);
        }

        return cleaned.trim();
    }

    /**
     * Parse JSON element to List<String>, handling both string arrays and object
     * arrays
     */
    private List<String> parseStringList(com.google.gson.JsonElement jsonElement) {
        if (jsonElement == null || jsonElement.isJsonNull()) {
            return List.of();
        }

        try {
            if (!jsonElement.isJsonArray()) {
                return List.of();
            }

            com.google.gson.JsonArray jsonArray = jsonElement.getAsJsonArray();
            List<String> result = new java.util.ArrayList<>();

            for (int i = 0; i < jsonArray.size(); i++) {
                if (jsonArray.get(i).isJsonPrimitive()) {
                    // It's a string - add directly
                    result.add(jsonArray.get(i).getAsString());
                } else if (jsonArray.get(i).isJsonObject()) {
                    // It's an object - try to extract a string value
                    var obj = jsonArray.get(i).getAsJsonObject();
                    String value = null;

                    // Try common field names
                    if (obj.has("name")) {
                        value = obj.get("name").getAsString();
                    } else if (obj.has("value")) {
                        value = obj.get("value").getAsString();
                    } else if (obj.has("skill")) {
                        value = obj.get("skill").getAsString();
                    } else if (obj.has("achievement")) {
                        value = obj.get("achievement").getAsString();
                    } else if (obj.has("weakness")) {
                        value = obj.get("weakness").getAsString();
                    } else if (obj.has("recommendation")) {
                        value = obj.get("recommendation").getAsString();
                    } else if (obj.has("keyword")) {
                        value = obj.get("keyword").getAsString();
                    } else if (obj.has("description")) {
                        value = obj.get("description").getAsString();
                    } else {
                        // If no known field, take the first string value found
                        for (String key : obj.keySet()) {
                            if (obj.get(key).isJsonPrimitive()) {
                                value = obj.get(key).getAsString();
                                break;
                            }
                        }
                    }

                    if (value != null) {
                        result.add(value);
                    }
                }
            }

            return result;
        } catch (Exception e) {
            log.error("Failed to parse string list from JSON element", e);
            return List.of();
        }
    }

    /**
     * Extract text from PDF file
     */
    private String extractTextFromPDF(MultipartFile file) throws IOException {
        try (PDDocument document = Loader.loadPDF(file.getBytes())) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document);
        }
    }

    /**
     * Get resume report by user ID
     */
    public Resume getLatestResume(String userId) {
        return resumeRepository.findTopByUserIdOrderByAnalyzedAtDesc(userId);
    }

    /**
     * Get all resumes for user ordered by analysis date
     */
    public List<Resume> getAllResumes(String userId) {
        return resumeRepository.findByUserIdOrderByAnalyzedAtDesc(userId);
    }

    /**
     * Get resume by ID
     */
    public Resume getResumeById(String resumeId) {
        return resumeRepository.findById(resumeId).orElse(null);
    }

    /**
     * Upload resume without analysis (just store the file)
     */
    public Resume uploadResume(String userId, MultipartFile file) {
        log.info("Uploading resume for user: {}", userId);

        try {
            // Extract text from resume
            String extractedText = extractTextFromPDF(file);

            // Create resume record
            Resume resume = new Resume();
            resume.setUserId(userId);
            resume.setFileName(file.getOriginalFilename());
            resume.setFileType("PDF");
            resume.setOriginalText(extractedText);
            resume.setAnalyzedAt(LocalDateTime.now());
            resume.setCreatedAt(LocalDateTime.now());

            // Save to database
            return resumeRepository.save(resume);
        } catch (IOException e) {
            log.error("Failed to upload resume", e);
            throw new RuntimeException("Failed to upload resume: " + e.getMessage());
        }
    }

    /**
     * Analyze existing resume by ID (simplified - just returns the resume)
     */
    public Resume analyzeResumeById(String resumeId) {
        log.info("Analyzing resume by ID: {}", resumeId);

        Resume resume = getResumeById(resumeId);
        if (resume == null) {
            throw new RuntimeException("Resume not found");
        }

        // Return the resume with its text - the interview will use originalText
        return resume;
    }

    /**
     * Delete resume by ID
     */
    @Transactional
    public void deleteResume(String resumeId) {
        log.info("Deleting resume: {}", resumeId);

        Resume resume = resumeRepository.findById(resumeId).orElse(null);
        if (resume != null) {
            // Update user's current resume ID if this was the current resume
            User user = userRepository.findById(resume.getUserId()).orElse(null);
            if (user != null && resumeId.equals(user.getCurrentResumeId())) {
                user.setCurrentResumeId(null);
                user.setAtsScore(0.0);
                userRepository.save(user);
            }

            resumeRepository.deleteById(resumeId);
            log.info("Resume deleted successfully: {}", resumeId);
        }
    }
}
