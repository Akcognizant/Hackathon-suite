package com.cognizant.hackathon.dto;

import java.util.Map;

/** AI grading result: a suggested score per criterion name + free-text feedback. */
public record GradingResultDto(
        Map<String, Integer> scores,
        String feedback
) {
}
