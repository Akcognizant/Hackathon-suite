package com.cognizant.hackathon.dto;

/** Rubric criterion as consumed by the scoring UI: { name, max }. */
public record RubricCriterionDto(
        String name,
        int max
) {
}
