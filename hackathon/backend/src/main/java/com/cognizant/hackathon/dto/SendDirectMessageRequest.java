package com.cognizant.hackathon.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Payload for POST /admin/messages. Sender is derived from the JWT, not the client. */
public record SendDirectMessageRequest(
        @NotNull(message = "receiverId is required")
        Long receiverId,

        @NotBlank(message = "Message content cannot be empty")
        @Size(max = 2000, message = "Message cannot exceed 2000 characters")
        String content
) {
}
