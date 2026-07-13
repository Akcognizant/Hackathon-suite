package com.cognizant.hackathon.controller;

import com.cognizant.hackathon.dto.RubricCriterionDto;
import com.cognizant.hackathon.service.RubricService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Admin management of per-hackathon evaluation criteria (name + max score),
 * backed by the existing {@code RubricCriterion} model.
 */
@RestController
@RequestMapping("/admin/hackathons")
@Tag(name = "Evaluation Criteria", description = "Per-hackathon evaluation criteria")
@RequiredArgsConstructor
public class AdminCriteriaController {

    private final RubricService rubricService;

    @Operation(summary = "List a hackathon's evaluation criteria")
    @GetMapping("/{id}/criteria")
    public List<RubricCriterionDto> getCriteria(@PathVariable Long id) {
        return rubricService.getRubricForHackathon(id);
    }

    @Operation(summary = "Replace a hackathon's evaluation criteria (full set)")
    @PostMapping("/{id}/criteria")
    public List<RubricCriterionDto> setCriteria(@PathVariable Long id,
                                                @RequestBody List<RubricCriterionDto> criteria) {
        return rubricService.replaceCriteria(id, criteria);
    }
}
