package com.cognizant.hackathon.dto;

/**
 * A team member for the scouting + evaluation views. {@code role} is the member's
 * registration role; the {@code technicalScore}/{@code contributionType}/{@code evaluated}
 * fields carry their individual talent evaluation (null/false until assessed).
 */
public record TeamMemberDto(
        Long id,
        String name,
        String role,
        Integer technicalScore,
        String contributionType,
        boolean evaluated
) {
}
