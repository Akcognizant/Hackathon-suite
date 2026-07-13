package com.cognizant.hackathon.dto;

/** Result of an AI evaluation: the 0-10 score and qualitative feedback. */
public record AiEvaluationResponse(
        Long submissionId,
        Integer aiScore,
        String aiFeedback
) {
}
