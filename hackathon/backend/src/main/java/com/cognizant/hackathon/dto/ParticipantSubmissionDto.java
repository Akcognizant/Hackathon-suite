package com.cognizant.hackathon.dto;

/** A team's submission with its review outcome, as shown to participants. */
public record ParticipantSubmissionDto(
        Long id,
        String projectTitle,
        String description,
        String repositoryUrl,
        String status,
        Integer score,
        Integer aiScore,
        String aiFeedback,
        Long teamId,
        String teamName,
        Long hackathonId,
        String hackathonTitle
) {
}
