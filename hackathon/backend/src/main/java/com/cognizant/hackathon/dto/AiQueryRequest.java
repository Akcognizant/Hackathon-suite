package com.cognizant.hackathon.dto;

import io.swagger.v3.oas.annotations.media.Schema;

/** Prompt sent by the AI Navigator UI to POST /api/ai/query. */
@Schema(description = "AI Navigator prompt payload.")
public record AiQueryRequest(
        @Schema(description = "The user's question/prompt for the AI.",
                example = "Summarize the pending submissions.", requiredMode = Schema.RequiredMode.REQUIRED)
        String prompt
) {
}
