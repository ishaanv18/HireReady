package com.hireready.repository;

import com.hireready.model.InterviewExchange;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InterviewExchangeRepository extends MongoRepository<InterviewExchange, String> {
    List<InterviewExchange> findBySessionIdOrderByTimestampAsc(String sessionId);

    void deleteBySessionId(String sessionId);
}
