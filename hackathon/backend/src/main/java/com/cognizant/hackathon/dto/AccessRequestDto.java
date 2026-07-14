package com.cognizant.hackathon.dto;

import java.time.LocalDateTime;

/** Access request as shown to reviewing admins (never includes the password). */
public record AccessRequestDto(
        Long id,
        String name,
        String email,
        String requestedRole,
        String status,
        String reason,
        LocalDateTime createdAt,
        String reviewedBy,
        LocalDateTime reviewedAt
) {
}
