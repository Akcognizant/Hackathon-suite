package com.cognizant.hackathon.controller;

import com.cognizant.hackathon.dto.PageResponse;
import com.cognizant.hackathon.dto.SendMessageRequest;
import com.cognizant.hackathon.dto.TeamDto;
import com.cognizant.hackathon.dto.TeamMemberDto;
import com.cognizant.hackathon.dto.TeamMessageDto;
import com.cognizant.hackathon.dto.TeamScoutDto;
import com.cognizant.hackathon.exception.ResourceNotFoundException;
import com.cognizant.hackathon.service.TeamScoutService;
import com.cognizant.hackathon.service.TeamService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.concurrent.CompletableFuture;

/**
 * Admin-facing teams table + scouting profile. Read access (GET) is granted to
 * ADMIN + JUDGE (see SecurityConfig); posting messages falls through to ADMIN-only.
 */
@RestController
@RequestMapping("/admin/teams")
@Tag(name = "Teams", description = "Registered hackathon teams + scouting profiles")
@RequiredArgsConstructor
public class AdminTeamController {

    private final TeamService teamService;
    private final TeamScoutService teamScoutService;

    @Operation(summary = "List teams (paginated, sortable, search by name + filter by status)")
    @GetMapping("/page")
    public PageResponse<TeamDto> getTeamsPage(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @PageableDefault(size = 10, sort = "name", direction = Sort.Direction.ASC) Pageable pageable) {
        return teamService.getTeamsPage(search, status, pageable);
    }

    @Operation(summary = "Full scouting profile for one team (rank, score, members, repo link)")
    @GetMapping("/{id}/scout")
    public TeamScoutDto getScoutProfile(@PathVariable Long id) {
        return teamScoutService.getScoutDetail(id);
    }

    @Operation(summary = "Team members with their individual evaluation state (for talent evaluation)")
    @GetMapping("/{id}/members")
    public List<TeamMemberDto> getMembers(@PathVariable Long id) {
        return teamScoutService.getTeamMembers(id);
    }

    @Operation(summary = "Internal admin-to-team message history (chronological)")
    @GetMapping("/{id}/messages")
    public List<TeamMessageDto> getMessages(@PathVariable Long id) {
        return teamScoutService.getMessages(id);
    }

    @Operation(summary = "Send an internal message to a team (persisted asynchronously)")
    @PostMapping("/{id}/messages")
    public CompletableFuture<TeamMessageDto> sendMessage(
            @PathVariable Long id,
            @Valid @RequestBody SendMessageRequest request) {
        // Validate existence synchronously (fast) so we can 404 before dispatching
        // the async write; the external call keeps the @Async proxy in effect.
        if (!teamScoutService.teamExists(id)) {
            throw new ResourceNotFoundException("Team not found with id: " + id);
        }
        return teamScoutService.sendMessageAsync(id, request.body(), currentUsername());
    }

    /** The authenticated admin's name (email for JWT logins); "system" if unauthenticated. */
    private String currentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && auth.getName() != null) {
            return auth.getName();
        }
        return "system";
    }
}
