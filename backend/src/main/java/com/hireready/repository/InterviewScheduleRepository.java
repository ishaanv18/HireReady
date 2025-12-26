package com.hireready.repository;

import com.hireready.model.InterviewSchedule;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface InterviewScheduleRepository extends MongoRepository<InterviewSchedule, String> {

    List<InterviewSchedule> findByUserIdOrderByScheduledTimeDesc(String userId);

    List<InterviewSchedule> findByUserIdAndStatus(String userId, String status);

    List<InterviewSchedule> findByScheduledTimeBetween(LocalDateTime start, LocalDateTime end);

    Optional<InterviewSchedule> findBySessionId(String sessionId);
}
