package com.cognizant.hackathon.dto;

/** A single ranked row of an event's leaderboard. */
public record LeaderboardEntryDto(
        int rank,
        String team,
        String projectTitle,
        int score
) {
}
