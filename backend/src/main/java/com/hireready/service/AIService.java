package com.hireready.service;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.hireready.exception.AIServiceException;
import lombok.extern.slf4j.Slf4j;
import okhttp3.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
public class AIService {

    @Value("${ai.gemini.api.key}")
    private String geminiApiKey;

    @Value("${ai.gemini.api.url}")
    private String geminiApiUrl;

    @Value("${ai.groq.api.key}")
    private String groqApiKey;

    @Value("${ai.groq.api.url}")
    private String groqApiUrl;

    @Value("${ai.groq.model}")
    private String groqModel;

    private final OkHttpClient httpClient;
    private final Gson gson;

    public AIService() {
        this.httpClient = new OkHttpClient.Builder()
                .connectTimeout(30, TimeUnit.SECONDS)
                .readTimeout(60, TimeUnit.SECONDS)
                .writeTimeout(30, TimeUnit.SECONDS)
                .build();
        this.gson = new Gson();
    }

    /**
     * Generate AI response with automatic fallback from Gemini to Groq
     */
    public String generateResponse(String prompt) {
        try {
            log.info("Attempting to generate response using Gemini API");
            return callGeminiAPI(prompt);
        } catch (Exception e) {
            log.warn("Gemini API failed, falling back to Groq: {}", e.getMessage());
            try {
                return callGroqAPI(prompt);
            } catch (Exception groqException) {
                log.error("Both Gemini and Groq APIs failed", groqException);
                throw new AIServiceException("All AI services are currently unavailable", groqException);
            }
        }
    }

    /**
     * Call Gemini API
     */
    private String callGeminiAPI(String prompt) throws IOException {
        JsonObject requestBody = new JsonObject();
        JsonArray contents = new JsonArray();
        JsonObject content = new JsonObject();
        JsonArray parts = new JsonArray();
        JsonObject part = new JsonObject();

        part.addProperty("text", prompt);
        parts.add(part);
        content.add("parts", parts);
        contents.add(content);
        requestBody.add("contents", contents);

        RequestBody body = RequestBody.create(
                requestBody.toString(),
                MediaType.parse("application/json"));

        Request request = new Request.Builder()
                .url(geminiApiUrl + "?key=" + geminiApiKey)
                .post(body)
                .addHeader("Content-Type", "application/json")
                .build();

        try (Response response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                throw new IOException("Gemini API request failed: " + response.code() + " - " + response.message());
            }

            String responseBody = response.body().string();
            JsonObject jsonResponse = gson.fromJson(responseBody, JsonObject.class);

            return jsonResponse.getAsJsonArray("candidates")
                    .get(0).getAsJsonObject()
                    .getAsJsonObject("content")
                    .getAsJsonArray("parts")
                    .get(0).getAsJsonObject()
                    .get("text").getAsString();
        }
    }

    /**
     * Call Groq API (OpenAI-compatible)
     */
    private String callGroqAPI(String prompt) throws IOException {
        JsonObject requestBody = new JsonObject();
        requestBody.addProperty("model", groqModel);

        JsonArray messages = new JsonArray();
        JsonObject message = new JsonObject();
        message.addProperty("role", "user");
        message.addProperty("content", prompt);
        messages.add(message);

        requestBody.add("messages", messages);
        requestBody.addProperty("temperature", 0.7);
        requestBody.addProperty("max_tokens", 2000);

        RequestBody body = RequestBody.create(
                requestBody.toString(),
                MediaType.parse("application/json"));

        Request request = new Request.Builder()
                .url(groqApiUrl)
                .post(body)
                .addHeader("Content-Type", "application/json")
                .addHeader("Authorization", "Bearer " + groqApiKey)
                .build();

        try (Response response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                throw new IOException("Groq API request failed: " + response.code() + " - " + response.message());
            }

            String responseBody = response.body().string();
            JsonObject jsonResponse = gson.fromJson(responseBody, JsonObject.class);

            return jsonResponse.getAsJsonArray("choices")
                    .get(0).getAsJsonObject()
                    .getAsJsonObject("message")
                    .get("content").getAsString();
        }
    }

    /**
     * Parse resume text and extract structured information
     */
    public String parseResume(String resumeText) {
        String prompt = String.format("""
                Analyze the following resume and extract information in JSON format with these fields:
                - skills: array of technical and soft skills
                - projects: array of objects with {name, description, technologies, duration}
                - education: array of objects with {institution, degree, field, duration, grade}
                - achievements: array of notable achievements
                - experience: array of objects with {company, position, duration, responsibilities}

                Resume text:
                %s

                Return ONLY valid JSON, no additional text.
                """, resumeText);

        return generateResponse(prompt);
    }

    /**
     * Calculate ATS score and provide recommendations
     */
    public String analyzeResumeForATS(String resumeText, String targetRole) {
        String prompt = String.format("""
                Analyze this resume for ATS (Applicant Tracking System) compatibility for a %s role.

                Provide analysis in JSON format with:
                - atsScore: number between 0-100
                - skillGapAnalysis: object with {missingSkills, presentSkills, recommendations}
                - weaknesses: array of resume weaknesses
                - recommendations: array of improvement suggestions
                - improvedBulletPoints: array of 5 improved bullet points
                - atsKeywords: array of important keywords for ATS

                Resume:
                %s

                Return ONLY valid JSON, no additional text.
                """, targetRole, resumeText);

        return generateResponse(prompt);
    }

    /**
     * Generate interview question based on role and difficulty
     */
    public String generateInterviewQuestion(String role, int difficultyLevel, String previousContext) {
        String prompt = String.format("""
                Generate a %s interview question for difficulty level %d (1=easy, 5=very hard).

                Previous context: %s

                Return a JSON object with:
                - question: the interview question
                - expectedKeyPoints: array of key points expected in a good answer

                Return ONLY valid JSON, no additional text.
                """, role, difficultyLevel, previousContext != null ? previousContext : "None");

        return generateResponse(prompt);
    }

    /**
     * Evaluate interview answer
     */
    public String evaluateAnswer(String question, String answer, String role) {
        String prompt = String.format("""
                Evaluate this interview answer for a %s position.

                Question: %s
                Answer: %s

                Provide evaluation in JSON format with:
                - score: number between 0-10
                - feedback: detailed feedback on the answer
                - sentiment: overall sentiment (POSITIVE, NEUTRAL, NEGATIVE)
                - confidenceLevel: number between 0-1 indicating answer confidence
                - fillerWordCount: count of filler words (um, uh, like, etc.)
                - detectedEmotions: array of emotions detected
                - technicalAccuracy: score 0-10 for technical correctness
                - communicationClarity: score 0-10 for clarity
                - shouldIncreaseDifficulty: boolean indicating if next question should be harder

                Return ONLY valid JSON, no additional text.
                """, role, question, answer);

        return generateResponse(prompt);
    }

    /**
     * Generate comprehensive interview feedback
     */
    public String generateInterviewFeedback(String role, String sessionData) {
        String prompt = String.format("""
                Generate comprehensive interview feedback for a %s interview.

                Session data: %s

                Provide feedback in JSON format with:
                - overallReadiness: percentage 0-100
                - strengths: array of strengths demonstrated
                - improvements: array of areas for improvement
                - detailedFeedback: comprehensive feedback text

                Return ONLY valid JSON, no additional text.
                """, role, sessionData);

        return generateResponse(prompt);
    }

    /**
     * Suggest companies based on user query
     */
    public String suggestCompanies(String query) {
        String prompt = String.format(
                "Based on the query '%s', suggest 10 relevant company names from around the world. " +
                        "Include tech companies, startups, and well-known corporations. " +
                        "Return ONLY a JSON array of company names, nothing else. " +
                        "Format: [\"Company1\", \"Company2\", ...]",
                query);
        return generateResponse(prompt);
    }

    /**
     * Suggest roles based on company and query
     */
    public String suggestRoles(String query, String company) {
        String prompt = String.format(
                "Based on the query '%s' for company '%s', suggest 10 relevant job roles. " +
                        "Include technical roles, management roles, and entry-level positions. " +
                        "Return ONLY a JSON array of role names, nothing else. " +
                        "Format: [\"Role1\", \"Role2\", ...]",
                query, company != null ? company : "any company");
        return generateResponse(prompt);
    }

    /**
     * Suggest specific positions based on role and company
     */
    public String suggestPositions(String role, String company) {
        String prompt = String.format(
                "Based on the role '%s' at company '%s', suggest 10 specific job positions/titles. " +
                        "Include variations with different seniority levels (Junior, Senior, Lead, etc.). " +
                        "Return ONLY a JSON array of position titles, nothing else. " +
                        "Format: [\"Position1\", \"Position2\", ...]",
                role != null ? role : "any role",
                company != null ? company : "any company");
        return generateResponse(prompt);
    }

    /**
     * Generate contextual interview question based on conversation history
     */
    public String generateInterviewQuestion(String company, String position, String roundType,
            String difficulty, int questionNumber, String conversationHistory) {
        return generateInterviewQuestion(company, position, roundType, difficulty, questionNumber, conversationHistory,
                null);
    }

    /**
     * Generate interview question with optional resume context
     */
    public String generateInterviewQuestion(String company, String position, String roundType,
            String difficulty, int questionNumber, String conversationHistory, String resumeText) {

        // For the first question, always ask for introduction
        if (questionNumber == 1) {
            return String.format(
                    "Hello! Welcome to your interview for the %s position at %s. " +
                            "Before we begin, I'd like to get to know you better. " +
                            "Could you please introduce yourself and tell me a bit about your background?",
                    position, company);
        }

        // Build comprehensive prompt with all context
        StringBuilder promptBuilder = new StringBuilder();

        // Interview context
        promptBuilder.append(String.format(
                "You are an expert interviewer conducting a %s interview for %s at %s.\n\n",
                roundType, position, company));

        // Difficulty level guidance
        promptBuilder.append(String.format("DIFFICULTY LEVEL: %s\n", difficulty));
        switch (difficulty.toUpperCase()) {
            case "EASY":
                promptBuilder.append("- Ask fundamental concepts and basic scenarios\n");
                promptBuilder.append("- Focus on understanding core principles\n");
                promptBuilder.append("- Keep questions straightforward and clear\n\n");
                break;
            case "MEDIUM":
                promptBuilder.append("- Ask about practical applications and real-world scenarios\n");
                promptBuilder.append("- Include some problem-solving elements\n");
                promptBuilder.append("- Test deeper understanding of concepts\n\n");
                break;
            case "HARD":
                promptBuilder.append("- Ask complex, multi-layered questions\n");
                promptBuilder.append("- Include advanced concepts and edge cases\n");
                promptBuilder.append("- Test critical thinking and problem-solving skills\n\n");
                break;
        }

        // Round type specific guidance
        promptBuilder.append(String.format("ROUND TYPE: %s\n", roundType));
        switch (roundType.toUpperCase()) {
            case "HR":
                promptBuilder.append("- Focus on behavioral questions, cultural fit, and soft skills\n");
                promptBuilder.append("- Ask about past experiences, teamwork, and conflict resolution\n");
                promptBuilder.append("- Explore motivation, career goals, and company alignment\n\n");
                break;
            case "CODING":
                promptBuilder.append("- Ask about algorithms, data structures, and coding problems\n");
                promptBuilder.append("- Include questions about code optimization and complexity\n");
                promptBuilder.append("- Test problem-solving and technical implementation skills\n\n");
                break;
            case "COMMUNICATION":
                promptBuilder.append("- Assess clarity of expression and articulation\n");
                promptBuilder.append("- Ask about explaining complex topics to non-technical audiences\n");
                promptBuilder.append("- Test presentation and interpersonal skills\n\n");
                break;
            case "PROBLEM_SOLVING":
                promptBuilder.append("- Present analytical and logical reasoning challenges\n");
                promptBuilder.append("- Ask about approach to solving complex problems\n");
                promptBuilder.append("- Test critical thinking and structured problem-solving\n\n");
                break;
            case "APTITUDE":
                promptBuilder.append("- Ask quantitative and logical reasoning questions\n");
                promptBuilder.append("- Include puzzles, patterns, and analytical problems\n");
                promptBuilder.append("- Test numerical ability and logical thinking\n\n");
                break;
        }

        // Resume context (if provided)
        if (resumeText != null && !resumeText.trim().isEmpty()) {
            promptBuilder.append("CANDIDATE'S RESUME SUMMARY:\n");
            // Limit resume text to first 1000 characters to avoid token limits
            String resumeSummary = resumeText.length() > 1000
                    ? resumeText.substring(0, 1000) + "..."
                    : resumeText;
            promptBuilder.append(resumeSummary);
            promptBuilder.append("\n\n");
            promptBuilder.append("IMPORTANT: Use the resume information to:\n");
            promptBuilder.append("- Ask about specific projects, technologies, or experiences mentioned\n");
            promptBuilder.append("- Probe deeper into their claimed skills and achievements\n");
            promptBuilder.append("- Make questions relevant to their background\n\n");
        }

        // Conversation history
        if (!conversationHistory.isEmpty()) {
            promptBuilder.append("PREVIOUS CONVERSATION:\n");
            promptBuilder.append(conversationHistory);
            promptBuilder.append("\n\n");
        }

        // Question generation instructions
        promptBuilder.append(String.format("This is question #%d of the interview.\n\n", questionNumber));
        promptBuilder.append("GENERATE ONE INTERVIEW QUESTION that:\n");
        promptBuilder.append("1. Is highly relevant to the position, company, and round type\n");
        promptBuilder.append("2. Matches the specified difficulty level\n");
        promptBuilder.append("3. Builds naturally on previous questions (if any)\n");
        promptBuilder.append("4. Is specific, clear, and professional\n");
        promptBuilder.append("5. Allows the candidate to demonstrate their knowledge and skills\n");

        if (resumeText != null && !resumeText.trim().isEmpty()) {
            promptBuilder.append("6. References or relates to the candidate's resume when appropriate\n");
        }

        promptBuilder.append("\nIMPORTANT RULES:\n");
        promptBuilder.append("- Return ONLY the question text, nothing else\n");
        promptBuilder.append("- No numbering, no labels, no additional formatting\n");
        promptBuilder.append("- Make it conversational and natural\n");
        promptBuilder.append("- Ensure it's different from previous questions\n");

        return generateResponse(promptBuilder.toString());
    }

    /**
     * Evaluate user's answer to an interview question
     */
    public String evaluateAnswer(String question, String answer, String position, String difficulty) {
        String prompt = String.format(
                "You are evaluating an interview answer for the position: %s (Difficulty: %s)\n\n" +
                        "Question: %s\n\n" +
                        "Candidate's Answer: %s\n\n" +
                        "Provide a JSON evaluation with the following structure:\n" +
                        "{\n" +
                        "  \"score\": <number 0-10>,\n" +
                        "  \"feedback\": \"<brief constructive feedback>\"\n" +
                        "}\n\n" +
                        "Scoring criteria:\n" +
                        "- 9-10: Excellent, comprehensive answer\n" +
                        "- 7-8: Good answer with minor gaps\n" +
                        "- 5-6: Acceptable but needs improvement\n" +
                        "- 3-4: Weak answer, missing key points\n" +
                        "- 0-2: Poor or irrelevant answer\n\n" +
                        "Return ONLY the JSON object, nothing else.",
                position, difficulty, question, answer);
        return generateResponse(prompt);
    }

    /**
     * Generate comprehensive final interview report
     */
    public String generateFinalReport(String company, String position, String roundType,
            String difficulty, String fullTranscript, int questionCount) {
        String prompt = String.format(
                "You are generating a final evaluation report for an interview.\n\n" +
                        "Interview Details:\n" +
                        "- Company: %s\n" +
                        "- Position: %s\n" +
                        "- Round: %s\n" +
                        "- Difficulty: %s\n" +
                        "- Questions Asked: %d\n\n" +
                        "Full Interview Transcript:\n%s\n\n" +
                        "Generate a comprehensive evaluation report in JSON format:\n" +
                        "{\n" +
                        "  \"overallScore\": <number 0-100>,\n" +
                        "  \"decision\": \"<SELECTED|REJECTED|WAITLISTED>\",\n" +
                        "  \"strengths\": [\"strength1\", \"strength2\", \"strength3\"],\n" +
                        "  \"weaknesses\": [\"weakness1\", \"weakness2\"],\n" +
                        "  \"improvements\": [\"suggestion1\", \"suggestion2\", \"suggestion3\"],\n" +
                        "  \"detailedFeedback\": \"<2-3 sentence overall assessment>\"\n" +
                        "}\n\n" +
                        "Decision criteria:\n" +
                        "- SELECTED: Overall score >= 70\n" +
                        "- WAITLISTED: Overall score 50-69\n" +
                        "- REJECTED: Overall score < 50\n\n" +
                        "Return ONLY the JSON object, nothing else.",
                company, position, roundType, difficulty, questionCount, fullTranscript);
        return generateResponse(prompt);
    }
}
