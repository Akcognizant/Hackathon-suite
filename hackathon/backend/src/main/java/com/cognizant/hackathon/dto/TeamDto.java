package com.cognizant.hackathon.dto;

/**
 * A team row for the scouting directory.
 *
 * @param status         the team's PROJECT review status (its submission's
 *                       APPROVED/PENDING/REJECTED), falling back to the team's own
 *                       registration status when it has no submission yet.
 * @param score          raw human score (points) — kept for reference/detail.
 * @param normalizedScore score as a percentage (0–100) of the hackathon's max, used
 *                        for fair cross-hackathon ranking (see TeamRankingService).
 */
public record TeamDto(
        Long id,
        String team,
        String hackathon,
        String status,
        Integer rank,
        Integer score,
        Integer normalizedScore
) {
}
