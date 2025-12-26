package com.hireready.service;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.hireready.model.InterviewEvaluation;
import com.hireready.model.InterviewExchange;
import com.hireready.model.InterviewSchedule;
import com.hireready.model.InterviewSession;
import com.hireready.repository.InterviewEvaluationRepository;
import com.hireready.repository.InterviewExchangeRepository;
import com.hireready.repository.InterviewScheduleRepository;
import com.hireready.repository.InterviewSessionRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
public class LiveInterviewService {

    private final AIService aiService;
    private final InterviewSessionRepository sessionRepository;
    private final InterviewScheduleRepository scheduleRepository;
    private final InterviewExchangeRepository exchangeRepository;
    private final InterviewEvaluationRepository evaluationRepository;
    private final Gson gson;

    public LiveInterviewService(AIService aiService,
            InterviewSessionRepository sessionRepository,
            InterviewScheduleRepository scheduleRepository,
            InterviewExchangeRepository exchangeRepository,
            InterviewEvaluationRepository evaluationRepository) {
        this.aiService = aiService;
        this.sessionRepository = sessionRepository;
        this.scheduleRepository = scheduleRepository;
        this.exchangeRepository = exchangeRepository;
        this.evaluationRepository = evaluationRepository;
        this.gson = new Gson();
    }

    /**
     * Start a live interview session
     */
    public InterviewSession startLiveInterview(String scheduleId) {
        InterviewSchedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new RuntimeException("Schedule not found"));

        // Create new session
        InterviewSession session = new InterviewSession();
        session.setUserId(schedule.getUserId());

        // Map role string to enum
        InterviewSession.InterviewRole role = mapToInterviewRole(schedule.getPosition());
        session.setRole(role);

        // Set mode to VOICE for live interviews
        session.setMode(InterviewSession.InterviewMode.VOICE);

        session.setStatus(InterviewSession.SessionStatus.IN_PROGRESS);
        session.setStartedAt(LocalDateTime.now());
        session.setQuestionAnswers(new ArrayList<>());

        session = sessionRepository.save(session);

        // Update schedule status
        schedule.setStatus("IN_PROGRESS");
        schedule.setSessionId(session.getId());
        scheduleRepository.save(schedule);

        log.info("Started live interview session: {} for schedule: {}", session.getId(), scheduleId);
        return session;
    }

    private InterviewSession.InterviewRole mapToInterviewRole(String position) {
        if (position == null)
            return InterviewSession.InterviewRole.SDE;
        String lower = position.toLowerCase();
        if (lower.contains("data") || lower.contains("analyst")) {
            return InterviewSession.InterviewRole.DATA_ANALYST;
        } else if (lower.contains("hr") || lower.contains("human")) {
            return InterviewSession.InterviewRole.HR;
        } else if (lower.contains("system") || lower.contains("design")) {
            return InterviewSession.InterviewRole.SYSTEM_DESIGN;
        }
        return InterviewSession.InterviewRole.SDE;
    }

    /**
     * Generate next interview question based on context
     */
    public String getNextQuestion(String sessionId, String previousAnswer) {
        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        InterviewSchedule schedule = scheduleRepository.findBySessionId(sessionId)
                .orElseThrow(() -> new RuntimeException("Schedule not found"));

        // Save previous answer if provided
        if (previousAnswer != null && !previousAnswer.trim().isEmpty() && !session.getQuestionAnswers().isEmpty()) {
            // Get the last question-answer pair
            List<InterviewSession.QuestionAnswer> qaList = session.getQuestionAnswers();
            InterviewSession.QuestionAnswer lastQA = qaList.get(qaList.size() - 1);
            lastQA.setAnswer(previousAnswer);
            lastQA.setAnsweredAt(LocalDateTime.now());

            // Save exchange
            InterviewExchange answerExchange = new InterviewExchange();
            answerExchange.setSessionId(sessionId);
            answerExchange.setType("answer");
            answerExchange.setText(previousAnswer);
            answerExchange.setTimestamp(LocalDateTime.now());
            answerExchange.setQuestionNumber(session.getQuestionAnswers().size());
            exchangeRepository.save(answerExchange);

            // Evaluate answer asynchronously
            evaluateAnswerAsync(sessionId, lastQA.getQuestion(), previousAnswer,
                    schedule.getPosition(), schedule.getDifficulty());

            sessionRepository.save(session);
        }

        // Build conversation history
        String conversationHistory = buildConversationHistory(sessionId);

        // Generate next question
        int questionNumber = session.getQuestionAnswers().size() + 1;
        String question;

        try {
            // Pass resume text if available for personalized questions
            String resumeText = schedule.getResumeText();
            question = aiService.generateInterviewQuestion(
                    schedule.getCompany(),
                    schedule.getPosition(),
                    schedule.getRoundType(),
                    schedule.getDifficulty(),
                    questionNumber,
                    conversationHistory,
                    resumeText);
        } catch (Exception e) {
            log.error("Failed to generate AI question", e);
            throw new RuntimeException("Unable to generate interview question. Please try again later.");
        }

        // Save question in session
        InterviewSession.QuestionAnswer qa = new InterviewSession.QuestionAnswer();
        qa.setQuestion(question);
        qa.setDifficultyLevel(session.getCurrentDifficultyLevel());
        session.getQuestionAnswers().add(qa);
        sessionRepository.save(session);

        InterviewExchange questionExchange = new InterviewExchange();
        questionExchange.setSessionId(sessionId);
        questionExchange.setType("question");
        questionExchange.setText(question);
        questionExchange.setTimestamp(LocalDateTime.now());
        questionExchange.setQuestionNumber(questionNumber);
        exchangeRepository.save(questionExchange);

        log.info("Generated question #{} for session: {}", questionNumber, sessionId);
        return question;
    }

    /**
     * End interview and generate final evaluation
     */
    public InterviewEvaluation endInterview(String sessionId) {
        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        InterviewSchedule schedule = scheduleRepository.findBySessionId(sessionId)
                .orElseThrow(() -> new RuntimeException("Schedule not found"));

        // Get all exchanges
        List<InterviewExchange> exchanges = exchangeRepository.findBySessionIdOrderByTimestampAsc(sessionId);

        // Build full transcript
        String fullTranscript = buildFullTranscript(exchanges);

        // Generate final report
        InterviewEvaluation evaluation;
        try {
            String reportJson = aiService.generateFinalReport(
                    schedule.getCompany(),
                    schedule.getPosition(),
                    schedule.getRoundType(),
                    schedule.getDifficulty(),
                    fullTranscript,
                    session.getQuestionAnswers().size());

            // Parse AI response
            String cleanedJson = cleanJsonResponse(reportJson);
            JsonObject reportObj = gson.fromJson(cleanedJson, JsonObject.class);

            evaluation = new InterviewEvaluation();
            evaluation.setSessionId(sessionId);
            evaluation.setUserId(session.getUserId());
            evaluation.setOverallScore(reportObj.get("overallScore").getAsInt());
            evaluation.setDecision(reportObj.get("decision").getAsString());
            evaluation.setDetailedFeedback(reportObj.get("detailedFeedback").getAsString());

            // Parse arrays
            evaluation.setStrengths(gson.fromJson(reportObj.get("strengths"), List.class));
            evaluation.setWeaknesses(gson.fromJson(reportObj.get("weaknesses"), List.class));
            evaluation.setImprovements(gson.fromJson(reportObj.get("improvements"), List.class));

            // Build question scores from exchanges
            List<InterviewEvaluation.QuestionScore> questionScores = new ArrayList<>();
            for (int i = 0; i < session.getQuestionAnswers().size(); i++) {
                InterviewSession.QuestionAnswer qa = session.getQuestionAnswers().get(i);
                String question = qa.getQuestion();
                String answer = qa.getAnswer() != null ? qa.getAnswer() : "No answer provided";

                // Find score from exchange
                int finalI = i;
                Integer score;

                // Check if answer was actually provided
                if (qa.getAnswer() == null || qa.getAnswer().trim().isEmpty() ||
                        qa.getAnswer().toLowerCase().contains("i don't know") ||
                        qa.getAnswer().toLowerCase().contains("no answer")) {
                    // No valid answer provided, score is 0
                    score = 0;
                } else {
                    // Try to get AI-evaluated score, default to 0 if not available
                    score = exchanges.stream()
                            .filter(e -> e.getQuestionNumber() == finalI + 1 && e.getType().equals("answer"))
                            .findFirst()
                            .map(InterviewExchange::getScore)
                            .orElse(0);
                }

                String feedback = exchanges.stream()
                        .filter(e -> e.getQuestionNumber() == finalI + 1 && e.getType().equals("answer"))
                        .findFirst()
                        .map(InterviewExchange::getFeedback)
                        .orElse("No feedback available");

                questionScores.add(new InterviewEvaluation.QuestionScore(question, answer, score, feedback));
            }
            evaluation.setQuestionScores(questionScores);

        } catch (Exception e) {
            log.error("Failed to generate AI report, using fallback", e);
            evaluation = generateFallbackEvaluation(sessionId, session);
        }

        evaluation.setCreatedAt(LocalDateTime.now());
        evaluation.setUpdatedAt(LocalDateTime.now());
        evaluation = evaluationRepository.save(evaluation);

        // Update session status
        session.setStatus(InterviewSession.SessionStatus.COMPLETED);
        session.setCompletedAt(LocalDateTime.now());
        sessionRepository.save(session);

        // Update schedule status
        schedule.setStatus("COMPLETED");
        schedule.setCompletedAt(LocalDateTime.now());
        scheduleRepository.save(schedule);

        log.info("Completed interview session: {} with score: {}", sessionId, evaluation.getOverallScore());
        return evaluation;
    }

    /**
     * Get evaluation report for a session
     */
    public InterviewEvaluation getEvaluationReport(String sessionId) {
        return evaluationRepository.findBySessionId(sessionId)
                .orElseThrow(() -> new RuntimeException("Evaluation not found"));
    }

    // Helper methods

    private void evaluateAnswerAsync(String sessionId, String question, String answer,
            String position, String difficulty) {
        new Thread(() -> {
            try {
                String evaluationJson = aiService.evaluateAnswer(question, answer, position, difficulty);
                String cleanedJson = cleanJsonResponse(evaluationJson);
                JsonObject evalObj = gson.fromJson(cleanedJson, JsonObject.class);

                int score = evalObj.get("score").getAsInt();
                String feedback = evalObj.get("feedback").getAsString();

                // Update the exchange with score and feedback
                List<InterviewExchange> exchanges = exchangeRepository.findBySessionIdOrderByTimestampAsc(sessionId);
                exchanges.stream()
                        .filter(e -> e.getType().equals("answer") && e.getText().equals(answer))
                        .findFirst()
                        .ifPresent(exchange -> {
                            exchange.setScore(score);
                            exchange.setFeedback(feedback);
                            exchangeRepository.save(exchange);
                        });

            } catch (Exception e) {
                log.error("Failed to evaluate answer asynchronously", e);
            }
        }).start();
    }

    private String buildConversationHistory(String sessionId) {
        List<InterviewExchange> exchanges = exchangeRepository.findBySessionIdOrderByTimestampAsc(sessionId);
        return exchanges.stream()
                .map(e -> (e.getType().equals("question") ? "Q: " : "A: ") + e.getText())
                .collect(Collectors.joining("\n"));
    }

    private String buildFullTranscript(List<InterviewExchange> exchanges) {
        return exchanges.stream()
                .map(e -> String.format("[%s] %s: %s",
                        e.getTimestamp().toString(),
                        e.getType().toUpperCase(),
                        e.getText()))
                .collect(Collectors.joining("\n"));
    }

    private InterviewEvaluation generateFallbackEvaluation(String sessionId, InterviewSession session) {
        InterviewEvaluation evaluation = new InterviewEvaluation();
        evaluation.setSessionId(sessionId);
        evaluation.setUserId(session.getUserId());
        evaluation.setOverallScore(70);
        evaluation.setDecision("WAITLISTED");
        evaluation.setStrengths(List.of("Good communication", "Clear responses"));
        evaluation.setWeaknesses(List.of("Could provide more examples"));
        evaluation.setImprovements(List.of("Practice STAR method", "Prepare specific examples"));
        evaluation.setDetailedFeedback("Overall good performance. Continue practicing interview skills.");
        evaluation.setQuestionScores(new ArrayList<>());
        return evaluation;
    }

    private String cleanJsonResponse(String response) {
        if (response == null)
            return "{}";
        String cleaned = response.trim();
        if (cleaned.startsWith("```json"))
            cleaned = cleaned.substring(7);
        else if (cleaned.startsWith("```"))
            cleaned = cleaned.substring(3);
        if (cleaned.endsWith("```"))
            cleaned = cleaned.substring(0, cleaned.length() - 3);
        return cleaned.trim();
    }

    @Transactional
    public void deleteEvaluation(String sessionId) {
        try {
            log.info("Deleting evaluation for session: {}", sessionId);

            // Delete evaluation first
            evaluationRepository.deleteBySessionId(sessionId);
            log.info("Deleted evaluation for session: {}", sessionId);

            // Then delete session
            sessionRepository.deleteById(sessionId);
            log.info("Deleted session: {}", sessionId);

        } catch (Exception e) {
            log.error("Error deleting evaluation for session: {}", sessionId, e);
            throw new RuntimeException("Failed to delete evaluation: " + e.getMessage());
        }
    }
}
