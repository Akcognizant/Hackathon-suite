package com.cognizant.hackathon.controller;

import com.cognizant.hackathon.dto.TeamDto;
import com.cognizant.hackathon.service.TeamService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.SortDefault;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/teams")
@RequiredArgsConstructor
public class TeamController {

    private final TeamService teamService;

    @GetMapping
    public List<TeamDto> getAllTeams(
            @SortDefault(sort = "name", direction = Sort.Direction.ASC) Sort sort) {
        return teamService.getAllTeams(sort);
    }
}
