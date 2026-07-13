package com.cognizant.hackathon.dto;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Team-facing payload for the public POST /submissions endpoint. Fields are
 * validated in the service (after the X-Team-Secret check) so that an
 * unauthenticated caller never sees field-level validation details.
 */
@Schema(description = "Project submission payload sent by a team.")
public record CreateSubmissionRequest(

        @Schema(description = "Name of the hackathon being submitted to.",
                example = "AI Innovation Sprint", requiredMode = Schema.RequiredMode.REQUIRED)
        String hackathonName,

        @Schema(description = "Name of an existing team registered in that hackathon.",
                example = "Neural Ninjas", requiredMode = Schema.RequiredMode.REQUIRED)
        String teamName,

        @Schema(description = "Title of the submitted project.",
                example = "CostGuard — AI Cloud Spend Optimizer", requiredMode = Schema.RequiredMode.REQUIRED)
        String projectTitle,

        @Schema(description = "Public URL of the project repository.",
                example = "https://github.com/neural-ninjas/costguard", requiredMode = Schema.RequiredMode.REQUIRED)
        String repoLink
) {
}
