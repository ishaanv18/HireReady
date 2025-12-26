package com.hireready.service;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.hireready.model.InterviewSession;
import com.hireready.model.User;
import com.hireready.repository.InterviewSessionRepository;
import com.hireready.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
public class InterviewService {

    private final InterviewSessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final AIService aiService;
    private final Gson gson;

    public InterviewService(InterviewSessionRepository sessionRepository,
            UserRepository userRepository,
            AIService aiService) {
        this.sessionRepository = sessionRepository;
        this.userRepository = userRepository;
        this.aiService = aiService;
        this.gson = new Gson();
    }

    /**
     * Start a new interview session
     */
    @Transactional
    public InterviewSession startInterview(String userId, InterviewSession.InterviewRole role,
            InterviewSession.InterviewMode mode) {
        log.info("Starting {} interview for user: {} in {} mode", role, userId, mode);

        // Check for existing in-progress session
        sessionRepository.findByUserIdAndStatus(userId, InterviewSession.SessionStatus.IN_PROGRESS)
                .ifPresent(session -> {
                    // Mark old session as abandoned
                    session.setStatus(InterviewSession.SessionStatus.ABANDONED);
                    sessionRepository.save(session);
                });

        // Create new session
        InterviewSession session = new InterviewSession();
        session.setUserId(userId);
        session.setRole(role);
        session.setMode(mode);
        session.setQuestionAnswers(new ArrayList<>());
        session.setCurrentDifficultyLevel(1);
        session.setStatus(InterviewSession.SessionStatus.IN_PROGRESS);
        session.setStartedAt(LocalDateTime.now());

        // Generate first question
        String questionJson = aiService.generateInterviewQuestion(role.toString(), 1, null);
        JsonObject questionData = gson.fromJson(questionJson, JsonObject.class);

        InterviewSession.QuestionAnswer firstQA = new InterviewSession.QuestionAnswer();
        firstQA.setQuestion(questionData.get("question").getAsString());
        firstQA.setDifficultyLevel(1);

        session.getQuestionAnswers().add(firstQA);

        return sessionRepository.save(session);
    }

    /**
     * Submit answer and get next question
     */
    @Transactional
    public InterviewSession submitAnswer(String sessionId, String answer) {
        log.info("Processing answer for session: {}", sessionId);

        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Interview session not found"));

        if (session.getStatus() != InterviewSession.SessionStatus.IN_PROGRESS) {
            throw new RuntimeException("Interview session is not active");
        }

        List<InterviewSession.QuestionAnswer> qaList = session.getQuestionAnswers();
        InterviewSession.QuestionAnswer currentQA = qaList.get(qaList.size() - 1);

        // Evaluate the answer
        String evaluationJson = aiService.evaluateAnswer(
                currentQA.getQuestion(),
                answer,
                session.getRole().toString());
        JsonObject evaluation = gson.fromJson(evaluationJson, JsonObject.class);

        // Update current Q&A with answer and evaluation
        currentQA.setAnswer(answer);
        currentQA.setScore(evaluation.get("score").getAsDouble());
        currentQA.setFeedback(evaluation.get("feedback").getAsString());
        currentQA.setAnsweredAt(LocalDateTime.now());

        // Set sentiment analysis
        InterviewSession.SentimentAnalysis sentiment = new InterviewSession.SentimentAnalysis();
        sentiment.setOverallSentiment(evaluation.get("sentiment").getAsString());
        sentiment.setConfidenceLevel(evaluation.get("confidenceLevel").getAsDouble());
        sentiment.setFillerWordCount(evaluation.get("fillerWordCount").getAsInt());
        sentiment.setDetectedEmotions(gson.fromJson(evaluation.get("detectedEmotions"), List.class));
        currentQA.setSentiment(sentiment);

        // Update session scores (running average)
        updateSessionScores(session, evaluation);

        // Determine next difficulty level
        boolean shouldIncreaseDifficulty = evaluation.get("shouldIncreaseDifficulty").getAsBoolean();
        int nextDifficulty = session.getCurrentDifficultyLevel();
        if (shouldIncreaseDifficulty && nextDifficulty < 5) {
            nextDifficulty++;
        } else if (!shouldIncreaseDifficulty && nextDifficulty > 1 && currentQA.getScore() < 5) {
            nextDifficulty--;
        }
        session.setCurrentDifficultyLevel(nextDifficulty);

        // Generate next question if interview continues
        if (qaList.size() < 10) { // Limit to 10 questions per session
            String context = buildInterviewContext(session);
            String nextQuestionJson = aiService.generateInterviewQuestion(
                    session.getRole().toString(),
                    nextDifficulty,
                    context);
            JsonObject nextQuestionData = gson.fromJson(nextQuestionJson, JsonObject.class);

            InterviewSession.QuestionAnswer nextQA = new InterviewSession.QuestionAnswer();
            nextQA.setQuestion(nextQuestionData.get("question").getAsString());
            nextQA.setDifficultyLevel(nextDifficulty);

            qaList.add(nextQA);
        } else {
            // Complete the interview
            completeInterview(session);
        }

        return sessionRepository.save(session);
    }

    /**
     * Complete interview and generate comprehensive feedback
     */
    @Transactional
    public InterviewSession completeInterview(String sessionId) {
        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Interview session not found"));

        return completeInterview(session);
    }

    private InterviewSession completeInterview(InterviewSession session) {
        log.info("Completing interview session: {}", session.getId());

        // Build session summary for AI
        String sessionData = gson.toJson(session.getQuestionAnswers());

        // Generate comprehensive feedback
        String feedbackJson = aiService.generateInterviewFeedback(
                session.getRole().toString(),
                sessionData);
        JsonObject feedback = gson.fromJson(feedbackJson, JsonObject.class);

        session.setOverallReadiness(feedback.get("overallReadiness").getAsDouble());
        session.setDetailedFeedback(feedback.get("detailedFeedback").getAsString());
        session.setStrengths(gson.fromJson(feedback.get("strengths"), List.class));
        session.setImprovements(gson.fromJson(feedback.get("improvements"), List.class));
        session.setStatus(InterviewSession.SessionStatus.COMPLETED);
        session.setCompletedAt(LocalDateTime.now());

        // Update user's interview readiness
        User user = userRepository.findById(session.getUserId()).orElseThrow();
        user.setInterviewReadiness(session.getOverallReadiness());
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        return sessionRepository.save(session);
    }

    /**
     * Update session scores based on latest answer evaluation
     */
    private void updateSessionScores(InterviewSession session, JsonObject evaluation) {
        List<InterviewSession.QuestionAnswer> qaList = session.getQuestionAnswers();
        int answeredCount = (int) qaList.stream().filter(qa -> qa.getAnswer() != null).count();

        if (answeredCount == 0)
            return;

        // Calculate running averages
        double technicalSum = qaList.stream()
                .filter(qa -> qa.getScore() != null)
                .mapToDouble(InterviewSession.QuestionAnswer::getScore)
                .sum();
        session.setTechnicalScore(technicalSum / answeredCount);

        double communicationScore = evaluation.get("communicationClarity").getAsDouble();
        session.setCommunicationScore(
                (session.getCommunicationScore() * (answeredCount - 1) + communicationScore) / answeredCount);

        double confidenceSum = qaList.stream()
                .filter(qa -> qa.getSentiment() != null)
                .mapToDouble(qa -> qa.getSentiment().getConfidenceLevel())
                .sum();
        session.setConfidenceScore((confidenceSum / answeredCount) * 10); // Scale to 0-10

        // Emotion stability (inverse of emotion variance)
        session.setEmotionStabilityScore(7.5); // Simplified for now
    }

    /**
     * Build context from previous questions and answers
     */
    private String buildInterviewContext(InterviewSession session) {
        StringBuilder context = new StringBuilder();
        context.append("Previous questions and answers:\n");

        for (InterviewSession.QuestionAnswer qa : session.getQuestionAnswers()) {
            if (qa.getAnswer() != null) {
                context.append("Q: ").append(qa.getQuestion()).append("\n");
                context.append("A: ").append(qa.getAnswer()).append("\n");
                context.append("Score: ").append(qa.getScore()).append("/10\n\n");
            }
        }

        return context.toString();
    }

    /**
     * Get interview history for user
     */
    public List<InterviewSession> getInterviewHistory(String userId) {
        return sessionRepository.findByUserIdOrderByStartedAtDesc(userId);
    }

    /**
     * Get interview session by ID
     */
    public InterviewSession getSession(String sessionId) {
        return sessionRepository.findById(sessionId).orElse(null);
    }

    /**
     * Get active session for user
     */
    public InterviewSession getActiveSession(String userId) {
        return sessionRepository.findByUserIdAndStatus(userId, InterviewSession.SessionStatus.IN_PROGRESS)
                .orElse(null);
    }
}
