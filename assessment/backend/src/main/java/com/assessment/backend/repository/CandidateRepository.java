package com.assessment.backend.repository;

import com.assessment.backend.model.Candidate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface CandidateRepository extends JpaRepository<Candidate, UUID> {

    // Used in login — find by username
    Optional<Candidate> findByUsername(String username);

    // Used in register — check if username already taken
    boolean existsByUsername(String username);

    // Used in register — check if email already taken
    boolean existsByEmail(String email);
}