package com.cognizant.hackathon.controller;

import com.cognizant.hackathon.dto.RubricCriterionDto;
import com.cognizant.hackathon.service.RubricService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/hackathons")
@RequiredArgsConstructor
public class RubricController {

    private final RubricService rubricService;

    @GetMapping("/{hackathonId}/rubric")
    public List<RubricCriterionDto> getRubric(@PathVariable Long hackathonId) {
        return rubricService.getRubricForHackathon(hackathonId);
    }
}
