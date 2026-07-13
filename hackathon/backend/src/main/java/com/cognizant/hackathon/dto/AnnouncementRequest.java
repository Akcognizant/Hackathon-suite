package com.cognizant.hackathon.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Payload for POST /admin/messages/announcement — a broadcast to all participants. */
public record AnnouncementRequest(
        @NotBlank(message = "Announcement content cannot be empty")
        @Size(max = 2000, message = "Announcement cannot exceed 2000 characters")
        String content
) {
}
