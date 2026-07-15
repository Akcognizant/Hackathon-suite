package com.cognizant.hackathon.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/** Payload for adding a registered user to an existing team. */
public record AddTeamMemberRequest(
        @NotBlank(message = "Email is required")
        @Email(message = "A valid email is required")
        String email
) {
}
