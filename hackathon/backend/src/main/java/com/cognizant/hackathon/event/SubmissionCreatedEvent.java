package com.cognizant.hackathon.event;

/** Published when a team submits a project via the public submissions endpoint. */
public record SubmissionCreatedEvent(Long submissionId, String teamName, String projectTitle) {
}
