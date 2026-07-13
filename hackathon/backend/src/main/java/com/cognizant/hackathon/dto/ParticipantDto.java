package com.cognizant.hackathon.dto;

public record ParticipantDto(
        Long id,
        String name,
        String email,
        String teamName,
        String hackathon,
        String role,
        Integer technicalScore,
        String contributionType,
        boolean evaluated
) {
}
