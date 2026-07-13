package com.cognizant.hackathon.event;

/**
 * Published when a submission's score is assigned. Carries only primitives/IDs
 * (not the entity) so it stays valid across the transaction boundary, where the
 * AFTER_COMMIT listener handles it.
 */
public record SubmissionScoredEvent(Long submissionId, String teamName, int score, String gradedBy) {
}
