package com.cognizant.hackathon.dto;

import com.cognizant.hackathon.entity.enums.ContributionType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/** Payload for POST /admin/participants/{id}/evaluate — an individual talent assessment. */
public record EvaluateParticipantRequest(
        @NotNull(message = "Technical score is required")
        @Min(value = 1, message = "Technical score must be between 1 and 5")
        @Max(value = 5, message = "Technical score must be between 1 and 5")
        Integer technicalScore,

        @NotNull(message = "Contribution type is required")
        ContributionType contributionType
) {
}
