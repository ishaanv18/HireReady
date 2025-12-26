package com.hireready.repository;

import com.hireready.model.InterviewSession;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InterviewSessionRepository extends MongoRepository<InterviewSession, String> {

    List<InterviewSession> findByUserId(String userId);

    List<InterviewSession> findByUserIdOrderByStartedAtDesc(String userId);

    Optional<InterviewSession> findByUserIdAndStatus(String userId, InterviewSession.SessionStatus status);

    List<InterviewSession> findByUserIdAndRole(String userId, InterviewSession.InterviewRole role);
}
