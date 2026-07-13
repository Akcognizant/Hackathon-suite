package com.cognizant.hackathon.dto;

public record TeamDto(
        Long id,
        String team,
        String hackathon,
        String status,
        Integer rank,
        Integer score
) {
}
