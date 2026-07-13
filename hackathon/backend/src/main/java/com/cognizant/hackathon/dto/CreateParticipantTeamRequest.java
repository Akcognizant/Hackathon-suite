package com.cognizant.hackathon.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

/** Payload for a participant creating a team for a hackathon. */
public record CreateParticipantTeamRequest(
        @NotBlank(message = "Team name is required")
        String name,

        String description,

        @NotNull(message = "hackathonId is required")
        Long hackathonId,

        /** Optional invited member emails (the creator is always added). */
        List<String> members
) {
}
