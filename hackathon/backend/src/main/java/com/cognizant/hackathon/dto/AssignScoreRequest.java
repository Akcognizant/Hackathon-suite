package com.cognizant.hackathon.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.util.List;

/**
 * Body for POST /admin/scores. Carries the project rubric total plus an optional
 * list of individual member evaluations, all persisted in one transaction, e.g.
 * { "submissionId": 3, "score": 90, "evaluations": [{ "memberId": 5, "score": 4, "role": "LEAD" }] }.
 */
public record AssignScoreRequest(
        @NotNull(message = "submissionId is required")
        Long submissionId,

        @NotNull(message = "score is required")
        @PositiveOrZero(message = "score must be zero or positive")
        Integer score,

        @Valid
        List<ParticipantEvaluation> evaluations
) {
}
