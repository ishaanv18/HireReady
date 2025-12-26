package com.hireready.repository;

import com.hireready.model.Resume;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ResumeRepository extends MongoRepository<Resume, String> {

    List<Resume> findByUserId(String userId);

    List<Resume> findByUserIdOrderByAnalyzedAtDesc(String userId);

    Resume findTopByUserIdOrderByAnalyzedAtDesc(String userId);

    Optional<Resume> findFirstByUserIdOrderByCreatedAtDesc(String userId);
}
