package com.hireready.repository;

import com.hireready.model.InterviewEvaluation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InterviewEvaluationRepository extends MongoRepository<InterviewEvaluation, String> {
    Optional<InterviewEvaluation> findBySessionId(String sessionId);

    List<InterviewEvaluation> findByUserId(String userId);

    void deleteBySessionId(String sessionId);
}
