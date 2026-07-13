package com.cognizant.hackathon.controller;

import com.cognizant.hackathon.dto.LeaderboardEntryDto;
import com.cognizant.hackathon.service.LeaderboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/leaderboard")
@Tag(name = "Leaderboard", description = "Per-event rankings")
@RequiredArgsConstructor
public class LeaderboardController {

    private final LeaderboardService leaderboardService;

    @Operation(summary = "Get the ranked leaderboard for an event")
    @GetMapping("/{eventId}")
    public List<LeaderboardEntryDto> getLeaderboard(@PathVariable Long eventId) {
        return leaderboardService.getLeaderboard(eventId);
    }
}
