package com.assessment.backend.repository;

import com.assessment.backend.model.Response;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ResponseRepository extends JpaRepository<Response, UUID> {

    // Get all responses for a session in attempt order — used for resume, result, analytics
    List<Response> findBySessionIdOrderByDisplayOrder(UUID sessionId);

    // A single pinned response row — used for autosave
    Optional<Response> findBySession_IdAndQuestion_Id(UUID sessionId, UUID questionId);
}