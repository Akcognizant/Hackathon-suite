package com.cognizant.hackathon.event;

/**
 * Published after a submission's status changes (e.g. PENDING -> APPROVED).
 * Carries the new status so the listener can phrase the activity appropriately.
 */
public record SubmissionStatusChangedEvent(
        Long submissionId,
        String teamName,
        String projectTitle,
        String newStatus) {
}
