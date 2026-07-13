package com.cognizant.hackathon.dto;

import java.time.LocalDate;

/** A hackathon as presented to participants (never exposes the submission secret). */
public record ParticipantEventDto(
        Long id,
        String title,
        String description,
        LocalDate startDate,
        LocalDate endDate,
        String status,
        Integer minTeamSize,
        Integer maxTeamSize,
        long teamCount
) {
}
