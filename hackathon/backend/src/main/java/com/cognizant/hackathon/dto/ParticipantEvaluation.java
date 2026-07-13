package com.cognizant.hackathon.dto;

import com.cognizant.hackathon.entity.enums.ContributionType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * One member's individual evaluation, submitted as part of the grading request so
 * it persists atomically with the project score.
 */
public record ParticipantEvaluation(
        @NotNull(message = "memberId is required")
        Long memberId,

        @NotNull(message = "score is required")
        @Min(value = 1, message = "score must be between 1 and 5")
        @Max(value = 5, message = "score must be between 1 and 5")
        Integer score,

        @NotNull(message = "role is required")
        ContributionType role
) {
}
