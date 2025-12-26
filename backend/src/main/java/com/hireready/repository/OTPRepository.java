package com.hireready.repository;

import com.hireready.model.OTP;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OTPRepository extends MongoRepository<OTP, String> {

    Optional<OTP> findByUserIdAndVerifiedFalse(String userId);

    Optional<OTP> findByEmailAndVerifiedFalse(String email);

    void deleteByUserId(String userId);

    void deleteByEmail(String email);
}
