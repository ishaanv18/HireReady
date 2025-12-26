package com.hireready.service;

import com.hireready.model.InterviewSession;
import com.hireready.model.Resume;
import com.hireready.model.User;
import com.hireready.repository.InterviewSessionRepository;
import com.hireready.repository.ResumeRepository;
import com.hireready.repository.UserRepository;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    private final UserRepository userRepository;
    private final ResumeRepository resumeRepository;
    private final InterviewSessionRepository sessionRepository;

    public DashboardService(UserRepository userRepository,
            ResumeRepository resumeRepository,
            InterviewSessionRepository sessionRepository) {
        this.userRepository = userRepository;
        this.resumeRepository = resumeRepository;
        this.sessionRepository = sessionRepository;
    }

    /**
     * Get comprehensive dashboard metrics for user
     */
    public DashboardMetrics getDashboardMetrics(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        DashboardMetrics metrics = new DashboardMetrics();

        // User info
        metrics.setUsername(user.getUsername());
        metrics.setEmail(user.getEmail());

        // Profile scores
        metrics.setProfileScore(calculateProfileScore(user));
        metrics.setAtsScore(user.getAtsScore() != null ? user.getAtsScore() : 0.0);
        metrics.setInterviewReadiness(user.getInterviewReadiness() != null ? user.getInterviewReadiness() : 0.0);

        // Resume data
        Resume latestResume = resumeRepository.findFirstByUserIdOrderByCreatedAtDesc(userId).orElse(null);
        if (latestResume != null) {
            metrics.setHasResume(true);
            metrics.setResumeAnalysis(buildResumeAnalysis(latestResume));
        } else {
            metrics.setHasResume(false);
        }

        // Interview history
        List<InterviewSession> sessions = sessionRepository.findByUserIdOrderByStartedAtDesc(userId);
        metrics.setTotalInterviews(sessions.size());
        metrics.setCompletedInterviews((int) sessions.stream()
                .filter(s -> s.getStatus() == InterviewSession.SessionStatus.COMPLETED)
                .count());

        // Interview statistics
        if (!sessions.isEmpty()) {
            metrics.setInterviewStats(buildInterviewStats(sessions));
        }

        // Confidence and emotion index
        metrics.setConfidenceIndex(calculateConfidenceIndex(sessions));
        metrics.setEmotionStabilityIndex(calculateEmotionIndex(sessions));

        return metrics;
    }

    /**
     * Calculate overall profile score
     */
    private Double calculateProfileScore(User user) {
        double atsScore = user.getAtsScore() != null ? user.getAtsScore() : 0.0;
        double interviewScore = user.getInterviewReadiness() != null ? user.getInterviewReadiness() : 0.0;

        // Weighted average: 40% ATS, 60% Interview
        return (atsScore * 0.4) + (interviewScore * 0.6);
    }

    /**
     * Build resume analysis summary
     */
    private ResumeAnalysisSummary buildResumeAnalysis(Resume resume) {
        ResumeAnalysisSummary summary = new ResumeAnalysisSummary();
        summary.setAtsScore(resume.getAtsScore());
        summary.setSkillCount(resume.getSkills() != null ? resume.getSkills().size() : 0);
        summary.setProjectCount(resume.getProjects() != null ? resume.getProjects().size() : 0);
        summary.setTopSkills(resume.getSkills() != null && resume.getSkills().size() > 5
                ? resume.getSkills().subList(0, 5)
                : resume.getSkills());
        summary.setWeaknesses(resume.getWeaknesses());
        summary.setRecommendations(resume.getRecommendations());
        return summary;
    }

    /**
     * Build interview statistics
     */
    private InterviewStats buildInterviewStats(List<InterviewSession> sessions) {
        InterviewStats stats = new InterviewStats();

        List<InterviewSession> completed = sessions.stream()
                .filter(s -> s.getStatus() == InterviewSession.SessionStatus.COMPLETED)
                .collect(Collectors.toList());

        if (completed.isEmpty()) {
            return stats;
        }

        // Average scores
        stats.setAvgTechnicalScore(completed.stream()
                .mapToDouble(InterviewSession::getTechnicalScore)
                .average().orElse(0.0));

        stats.setAvgCommunicationScore(completed.stream()
                .mapToDouble(InterviewSession::getCommunicationScore)
                .average().orElse(0.0));

        stats.setAvgConfidenceScore(completed.stream()
                .mapToDouble(InterviewSession::getConfidenceScore)
                .average().orElse(0.0));

        // Interview by role
        Map<String, Long> byRole = sessions.stream()
                .collect(Collectors.groupingBy(
                        s -> s.getRole().toString(),
                        Collectors.counting()));
        stats.setInterviewsByRole(byRole);

        // Recent sessions for graph
        stats.setRecentSessions(completed.stream()
                .limit(10)
                .map(s -> {
                    SessionSummary summary = new SessionSummary();
                    summary.setRole(s.getRole().toString());
                    summary.setOverallReadiness(s.getOverallReadiness());
                    summary.setCompletedAt(s.getCompletedAt());
                    return summary;
                })
                .collect(Collectors.toList()));

        return stats;
    }

    /**
     * Calculate confidence index from interview history
     */
    private Double calculateConfidenceIndex(List<InterviewSession> sessions) {
        return sessions.stream()
                .filter(s -> s.getStatus() == InterviewSession.SessionStatus.COMPLETED)
                .mapToDouble(InterviewSession::getConfidenceScore)
                .average()
                .orElse(0.0);
    }

    /**
     * Calculate emotion stability index
     */
    private Double calculateEmotionIndex(List<InterviewSession> sessions) {
        return sessions.stream()
                .filter(s -> s.getStatus() == InterviewSession.SessionStatus.COMPLETED)
                .mapToDouble(InterviewSession::getEmotionStabilityScore)
                .average()
                .orElse(0.0);
    }

    // DTOs
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DashboardMetrics {
        private String username;
        private String email;
        private Double profileScore;
        private Double atsScore;
        private Double interviewReadiness;
        private Boolean hasResume;
        private ResumeAnalysisSummary resumeAnalysis;
        private Integer totalInterviews;
        private Integer completedInterviews;
        private InterviewStats interviewStats;
        private Double confidenceIndex;
        private Double emotionStabilityIndex;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ResumeAnalysisSummary {
        private Double atsScore;
        private Integer skillCount;
        private Integer projectCount;
        private List<String> topSkills;
        private List<String> weaknesses;
        private List<String> recommendations;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InterviewStats {
        private Double avgTechnicalScore;
        private Double avgCommunicationScore;
        private Double avgConfidenceScore;
        private Map<String, Long> interviewsByRole = new HashMap<>();
        private List<SessionSummary> recentSessions;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SessionSummary {
        private String role;
        private Double overallReadiness;
        private java.time.LocalDateTime completedAt;
    }
}
