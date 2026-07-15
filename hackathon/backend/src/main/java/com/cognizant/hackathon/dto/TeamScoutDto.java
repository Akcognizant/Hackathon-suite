package com.cognizant.hackathon.dto;

import java.util.List;

/**
 * Full scouting profile for one team. {@code rank}/{@code score}/{@code normalizedScore}
 * are computed server-side (see TeamRankingService); {@code status} is the project's
 * review status (its submission's), and {@code repositoryUrl} is sourced from the
 * team's submission and may be null ("profile incomplete").
 *
 * @param score           raw human score (points).
 * @param normalizedScore score as a percentage (0–100) of the hackathon's max — the
 *                        value the global rank is based on.
 */
public record TeamScoutDto(
        Long id,
        String team,
        String hackathon,
        String status,
        Integer rank,
        Integer score,
        Integer normalizedScore,
        String repositoryUrl,
        List<TeamMemberDto> members
) {
}
