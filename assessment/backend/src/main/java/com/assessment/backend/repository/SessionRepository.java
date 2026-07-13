package com.assessment.backend.repository;

import com.assessment.backend.model.AssessmentSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SessionRepository extends JpaRepository<AssessmentSession, UUID> {

    // The candidate's current in-progress attempt, if any — used to resume
    Optional<AssessmentSession> findFirstByCandidate_IdAndStatusOrderByStartedAtDesc(UUID candidateId, String status);

    // Count completed attempts for a candidate — used for attempt limit check
    @Query("SELECT COUNT(s) FROM AssessmentSession s WHERE s.candidate.id = :candidateId AND s.status = 'COMPLETED'")
    int countCompletedByCandidate(@Param("candidateId") UUID candidateId);

    // Get all completed sessions for a candidate — used for dashboard history
    @Query("SELECT s FROM AssessmentSession s WHERE s.candidate.id = :candidateId AND s.status = 'COMPLETED' ORDER BY s.completedAt DESC")
    List<AssessmentSession> findCompletedByCandidate(@Param("candidateId") UUID candidateId);

    // Get next attempt number for a candidate
    @Query("SELECT COUNT(s) + 1 FROM AssessmentSession s WHERE s.candidate.id = :candidateId")
    int getNextAttemptNumber(@Param("candidateId") UUID candidateId);
}