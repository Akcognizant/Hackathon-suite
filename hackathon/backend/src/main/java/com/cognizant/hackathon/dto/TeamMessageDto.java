package com.cognizant.hackathon.dto;

import java.time.Instant;

public record TeamMessageDto(
        Long id,
        Long teamId,
        String sender,
        String body,
        Instant createdAt
) {
}
