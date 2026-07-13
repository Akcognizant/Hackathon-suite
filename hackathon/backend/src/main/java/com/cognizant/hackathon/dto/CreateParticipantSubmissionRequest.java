package com.cognizant.hackathon.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/** Payload for a participant creating/updating their team's submission. */
public record CreateParticipantSubmissionRequest(
        @NotNull(message = "teamId is required")
        Long teamId,

        @NotBlank(message = "Project title is required")
        String projectTitle,

        @NotBlank(message = "Description is required")
        String description,

        @NotBlank(message = "Repository URL is required")
        String repositoryUrl
) {
}
