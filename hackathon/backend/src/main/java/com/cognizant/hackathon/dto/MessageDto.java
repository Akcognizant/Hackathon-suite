package com.cognizant.hackathon.dto;

import java.time.Instant;

/** A direct message with sender/receiver emails resolved for display. */
public record MessageDto(
        Long id,
        Long senderId,
        String senderEmail,
        Long receiverId,
        String receiverEmail,
        String messageType,
        String content,
        Instant createdAt,
        boolean read
) {
}
