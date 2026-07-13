package com.cognizant.hackathon.dto;

import java.util.List;

/** A team plus its roster, as shown in the participant portal. */
public record ParticipantTeamDto(
        Long id,
        String name,
        String status,
        Long hackathonId,
        String hackathonTitle,
        List<ParticipantMemberDto> members,
        int memberCount
) {
}
