package com.cognizant.hackathon.controller;

import com.cognizant.hackathon.dto.AiEvaluationResponse;
import com.cognizant.hackathon.dto.GradingResultDto;
import com.cognizant.hackathon.dto.PageResponse;
import com.cognizant.hackathon.dto.StatusUpdateRequest;
import com.cognizant.hackathon.dto.SubmissionDto;
import com.cognizant.hackathon.entity.Submission;
import com.cognizant.hackathon.service.SubmissionAiService;
import com.cognizant.hackathon.service.SubmissionGradingService;
import com.cognizant.hackathon.service.SubmissionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.data.web.SortDefault;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/admin/submissions")
@Tag(name = "Submissions", description = "Review project submissions")
@RequiredArgsConstructor
public class SubmissionController {

    private final SubmissionService submissionService;
    private final SubmissionAiService submissionAiService;
    private final SubmissionGradingService submissionGradingService;

    @Operation(summary = "List all submissions (sortable; sort fields are whitelisted)")
    @GetMapping
    public List<SubmissionDto> getAllSubmissions(
            @SortDefault(sort = "id", direction = Sort.Direction.DESC) Sort sort) {
        return submissionService.getAllSubmissions(sort);
    }

    @Operation(summary = "List submissions (paginated, sortable, filter by status/team)")
    @GetMapping("/page")
    public PageResponse<SubmissionDto> getSubmissionsPage(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String team,
            @PageableDefault(size = 10, sort = "id", direction = Sort.Direction.DESC) Pageable pageable) {
        return submissionService.getSubmissionsPage(status, team, pageable);
    }

    @Operation(summary = "Update a submission's review status (approve/reject)")
    @PutMapping("/{id}/status")
    public SubmissionDto updateStatus(@PathVariable Long id, @Valid @RequestBody StatusUpdateRequest request) {
        return submissionService.updateStatus(id, request.status());
    }

    @Operation(summary = "Run an AI evaluation of a submission and store the aiScore/aiFeedback")
    @PostMapping("/{id}/ai-evaluate")
    public AiEvaluationResponse evaluateWithAi(@PathVariable Long id) {
        Submission evaluated = submissionAiService.evaluateSubmission(id);
        return new AiEvaluationResponse(evaluated.getId(), evaluated.getAiScore(), evaluated.getAiFeedback());
    }

    @Operation(summary = "AI Grading Assistant: validate repo, score each rubric criterion, return feedback")
    @PostMapping("/{id}/evaluate")
    public GradingResultDto evaluate(@PathVariable Long id) {
        return submissionGradingService.evaluate(id);
    }
}
