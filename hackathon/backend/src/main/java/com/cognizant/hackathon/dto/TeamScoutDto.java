package com.cognizant.hackathon.dto;

import java.util.List;

/**
 * Full scouting profile for one team. {@code rank}/{@code score} are computed
 * server-side (see TeamRankingService); {@code repositoryUrl} is sourced from the
 * team's submission and may be null ("profile incomplete").
 */
public record TeamScoutDto(
        Long id,
        String team,
        String hackathon,
        String status,
        Integer rank,
        Integer score,
        String repositoryUrl,
        List<TeamMemberDto> members
) {
}
