package com.cognizant.hackathon.controller;

import com.cognizant.hackathon.dto.CreateSubmissionRequest;
import com.cognizant.hackathon.dto.HackathonOptionDto;
import com.cognizant.hackathon.dto.SubmissionDto;
import com.cognizant.hackathon.service.SubmissionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.enums.ParameterIn;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Public, team-facing submission intake. Not behind JWT — instead guarded by a
 * shared secret sent in the {@code X-Team-Secret} header. Separate from the
 * admin-only {@code /admin/submissions} controller.
 */
@RestController
@RequestMapping("/submissions")
@Tag(name = "Submission Intake", description = "Public team project submission")
@RequiredArgsConstructor
public class PublicSubmissionController {

    private final SubmissionService submissionService;

    @Operation(
            summary = "List hackathons available for submission",
            description = "Public, secret-free list (id + title) used to populate the submission form's "
                    + "hackathon dropdown.",
            security = {}) // public — overrides the global JWT default
    @GetMapping("/hackathons")
    public List<HackathonOptionDto> listHackathons() {
        return submissionService.listHackathonOptions();
    }

    @Operation(
            summary = "Submit a team project",
            description = "Guarded by the X-Team-Secret header (not JWT), validated against the named "
                    + "hackathon's own secret. Strict order: resolve hackathon (404) -> verify secret "
                    + "(401) -> resolve team within that hackathon (404) -> create PENDING submission "
                    + "and emit a SubmissionCreatedEvent for the dashboard.",
            // Overrides the global JWT default — this endpoint uses the team secret instead.
            security = @SecurityRequirement(name = "team-secret"))
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Submission created with status PENDING"),
            @ApiResponse(responseCode = "400",
                    description = "hackathonName, teamName, projectTitle or repoLink missing/blank",
                    content = @Content),
            @ApiResponse(responseCode = "401",
                    description = "X-Team-Secret missing or wrong for the named hackathon", content = @Content),
            @ApiResponse(responseCode = "404",
                    description = "Hackathon not found, or team not found within that hackathon",
                    content = @Content)
    })
    @PostMapping
    public ResponseEntity<SubmissionDto> createSubmission(
            @Parameter(
                    name = "X-Team-Secret",
                    in = ParameterIn.HEADER,
                    required = true,
                    description = "The target hackathon's submission secret (Hackathon.submissionSecret).")
            @RequestHeader(value = "X-Team-Secret", required = false) String teamSecret,
            @RequestBody CreateSubmissionRequest request) {

        // The per-hackathon secret check + processing all happen in the service,
        // which needs the hackathon (from the body) to know which secret to expect.
        SubmissionDto created = submissionService.createSubmission(request, teamSecret);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
}
