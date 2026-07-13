package com.cognizant.hackathon.dto;

public record ScoreResponse(
        Long submissionId,
        int score,
        Long eventId,
        String gradedBy
) {
}
