package com.cognizant.hackathon.dto;

/** A completed hackathon in the participant's history, with participation outcome. */
public record ParticipantHistoryDto(
        Long hackathonId,
        String hackathonTitle,
        String status,
        /** Whether the current participant took part (was on a team) in this hackathon. */
        boolean participated,
        String teamName,
        String projectTitle,
        /** Submission review status (PENDING/APPROVED/REJECTED), if they submitted. */
        String submissionStatus,
        Integer ranking,
        Integer score
) {
}
