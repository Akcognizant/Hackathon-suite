package com.cognizant.hackathon.dto;

/** A single team member as shown in the participant portal. */
public record ParticipantMemberDto(
        String name,
        String email,
        String role
) {
}
