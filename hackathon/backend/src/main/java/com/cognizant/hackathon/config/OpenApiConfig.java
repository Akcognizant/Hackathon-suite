package com.cognizant.hackathon.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeIn;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.annotations.security.SecuritySchemes;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.context.annotation.Configuration;

/**
 * Central OpenAPI metadata for the Hackathon Admin Portal.
 *
 * <p>Declares two security schemes so endpoints are testable from Swagger UI:
 * <ul>
 *   <li><b>bearer-jwt</b> — the admin JWT from POST /api/auth/login. Applied as the
 *       global default, so every operation requires it unless it opts out.</li>
 *   <li><b>team-secret</b> — the X-Team-Secret API-key header for the public
 *       submission intake (POST /submissions), which overrides the global default.</li>
 * </ul>
 * Note: this only documents/declares auth for the UI — actual enforcement lives in
 * SecurityConfig + TeamSecretValidator.
 */
@Configuration
@OpenAPIDefinition(
        info = @Info(
                title = "Hackathon Admin Portal API",
                version = "v1",
                description = "Endpoints for managing hackathons, teams, participants, submissions, "
                        + "scoring, leaderboards, and the dashboard activity feed."),
        // Global default: most endpoints require the admin JWT. Public endpoints opt out.
        security = @SecurityRequirement(name = "bearer-jwt"),
        // Ordered tag list (names must match each controller's @Tag to merge descriptions).
        tags = {
                @Tag(name = "Events", description = "Manage hackathon events"),
                @Tag(name = "Submissions", description = "Admin review of project submissions"),
                @Tag(name = "Submission Intake", description = "Public team project submission"),
                @Tag(name = "Scores", description = "Assign scores to submissions"),
                @Tag(name = "Leaderboard", description = "Per-event rankings"),
                @Tag(name = "Evaluation Criteria", description = "Per-hackathon evaluation criteria"),
                @Tag(name = "Participants", description = "Registered hackathon participants"),
                @Tag(name = "Dashboard", description = "Aggregated portal statistics"),
                @Tag(name = "Activity", description = "Dashboard activity feed")
        })
@SecuritySchemes({
        @SecurityScheme(
                name = "bearer-jwt",
                type = SecuritySchemeType.HTTP,
                scheme = "bearer",
                bearerFormat = "JWT",
                description = "Admin JWT obtained from POST /api/auth/login."),
        @SecurityScheme(
                name = "team-secret",
                type = SecuritySchemeType.APIKEY,
                in = SecuritySchemeIn.HEADER,
                paramName = "X-Team-Secret",
                description = "Shared secret required by the public POST /submissions endpoint.")
})
public class OpenApiConfig {
}
