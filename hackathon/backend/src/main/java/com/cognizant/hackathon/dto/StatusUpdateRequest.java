package com.cognizant.hackathon.dto;

import jakarta.validation.constraints.NotBlank;

/** Body for approving/rejecting a submission, e.g. { "status": "Approved" }. */
public record StatusUpdateRequest(
        @NotBlank(message = "Status is required")
        String status
) {
}
