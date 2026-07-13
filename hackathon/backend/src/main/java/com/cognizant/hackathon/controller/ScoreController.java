package com.cognizant.hackathon.controller;

import com.cognizant.hackathon.dto.AssignScoreRequest;
import com.cognizant.hackathon.dto.PageResponse;
import com.cognizant.hackathon.dto.ScoreResponse;
import com.cognizant.hackathon.dto.SubmissionDto;
import com.cognizant.hackathon.service.ScoreService;
import com.cognizant.hackathon.service.SubmissionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/scores")
@Tag(name = "Scores", description = "Assign scores to submissions")
@RequiredArgsConstructor
public class ScoreController {

    private final ScoreService scoreService;
    private final SubmissionService submissionService;

    @Operation(summary = "The grading worklist: APPROVED submissions (paginated, sortable)")
    @GetMapping("/page")
    public PageResponse<SubmissionDto> getScoringWorklist(
            @PageableDefault(size = 10, sort = "id", direction = Sort.Direction.DESC) Pageable pageable) {
        return submissionService.getSubmissionsPage("APPROVED", null, pageable);
    }

    @Operation(summary = "Assign a score to a submission and rebuild its event leaderboard")
    @PostMapping
    public ResponseEntity<ScoreResponse> assignScore(@Valid @RequestBody AssignScoreRequest request) {
        ScoreResponse response = scoreService.assignScore(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }
}
