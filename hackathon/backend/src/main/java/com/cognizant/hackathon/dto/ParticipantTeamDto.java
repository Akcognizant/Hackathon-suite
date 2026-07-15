package com.cognizant.hackathon.dto;

import java.time.LocalDate;
import java.util.List;

/** A team plus its roster, as shown in the participant portal. */
public record ParticipantTeamDto(
        Long id,
        String name,
        String status,
        Long hackathonId,
        String hackathonTitle,
        String hackathonStatus,
        LocalDate hackathonEndDate,
        List<ParticipantMemberDto> members,
        int memberCount
) {
}
