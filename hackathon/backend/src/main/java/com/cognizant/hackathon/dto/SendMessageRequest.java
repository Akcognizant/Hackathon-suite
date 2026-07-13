package com.cognizant.hackathon.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Payload for POST /admin/teams/{id}/messages. Sender is derived from the JWT, not the client. */
public record SendMessageRequest(
        @NotBlank(message = "Message cannot be empty")
        @Size(max = 2000, message = "Message cannot exceed 2000 characters")
        String body
) {
}
