package com.cognizant.hackathon.service;

import com.cognizant.hackathon.dto.TeamMemberDto;
import com.cognizant.hackathon.dto.TeamMessageDto;
import com.cognizant.hackathon.dto.TeamScoutDto;
import com.cognizant.hackathon.entity.Participant;
import com.cognizant.hackathon.entity.Submission;
import com.cognizant.hackathon.entity.Team;
import com.cognizant.hackathon.entity.TeamMessage;
import com.cognizant.hackathon.exception.ResourceNotFoundException;
import com.cognizant.hackathon.repository.ParticipantRepository;
import com.cognizant.hackathon.repository.SubmissionRepository;
import com.cognizant.hackathon.repository.TeamMessageRepository;
import com.cognizant.hackathon.repository.TeamRepository;
import com.cognizant.hackathon.service.TeamRankingService.Standings;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.concurrent.CompletableFuture;

/**
 * Backs the "Talent Scouting" experience: assembles a team's full profile
 * (rank, score, members, repo link) and handles internal admin-to-team messaging.
 */
@Service
@RequiredArgsConstructor
public class TeamScoutService {

    private final TeamRepository teamRepository;
    private final ParticipantRepository participantRepository;
    private final SubmissionRepository submissionRepository;
    private final TeamMessageRepository messageRepository;
    private final TeamRankingService rankingService;

    @Transactional(readOnly = true)
    public TeamScoutDto getScoutDetail(Long teamId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found with id: " + teamId));

        Standings standings = rankingService.compute();

        List<TeamMemberDto> members = participantRepository.findByTeamId(teamId).stream()
                .map(TeamScoutService::toMemberDto)
                .toList();

        List<Submission> submissions = submissionRepository.findByTeamId(teamId);

        // Repo link lives on the submission, not the team; first non-blank wins.
        String repositoryUrl = submissions.stream()
                .map(Submission::getRepositoryUrl)
                .filter(url -> url != null && !url.isBlank())
                .findFirst()
                .orElse(null);

        // Show the PROJECT review status (submission's). A decided status wins over a
        // still-PENDING one; fall back to the team's registration status if unsubmitted.
        String reviewStatus = null;
        for (Submission submission : submissions) {
            if (submission.getStatus() == null) {
                continue;
            }
            if (reviewStatus == null || "PENDING".equals(reviewStatus)) {
                reviewStatus = submission.getStatus().name();
            }
        }
        if (reviewStatus == null) {
            reviewStatus = team.getStatus() != null ? team.getStatus().name() : null;
        }

        return new TeamScoutDto(
                team.getId(),
                team.getName(),
                team.getHackathon() != null ? team.getHackathon().getTitle() : null,
                reviewStatus,
                standings.rankOf(teamId),
                standings.scoreOf(teamId),
                standings.percentOf(teamId),
                repositoryUrl,
                members);
    }

    /** Team members with their individual evaluation state — used by the grading eval modal. */
    @Transactional(readOnly = true)
    public List<TeamMemberDto> getTeamMembers(Long teamId) {
        if (!teamRepository.existsById(teamId)) {
            throw new ResourceNotFoundException("Team not found with id: " + teamId);
        }
        return participantRepository.findByTeamId(teamId).stream()
                .map(TeamScoutService::toMemberDto)
                .toList();
    }

    private static TeamMemberDto toMemberDto(Participant p) {
        return new TeamMemberDto(
                p.getId(),
                p.getName(),
                p.getRole() != null ? p.getRole().name() : null,
                p.getTechnicalScore(),
                p.getContributionType() != null ? p.getContributionType().name() : null,
                Boolean.TRUE.equals(p.getEvaluationStatus()));
    }

    @Transactional(readOnly = true)
    public List<TeamMessageDto> getMessages(Long teamId) {
        return messageRepository.findByTeamIdOrderByCreatedAtAsc(teamId).stream()
                .map(TeamScoutService::toDto)
                .toList();
    }

    /** Synchronous existence guard so the controller can return 404 before dispatching the async write. */
    @Transactional(readOnly = true)
    public boolean teamExists(Long teamId) {
        return teamRepository.existsById(teamId);
    }

    /**
     * Persists a message off the request thread. Called externally from the
     * controller (never self-invoked) so the @Async proxy actually applies;
     * the returned future lets Spring MVC process the request asynchronously.
     */
    @Async
    public CompletableFuture<TeamMessageDto> sendMessageAsync(Long teamId, String body, String sender) {
        TeamMessage saved = messageRepository.save(TeamMessage.builder()
                .teamId(teamId)
                .sender(sender)
                .body(body.trim())
                .createdAt(Instant.now())
                .build());
        return CompletableFuture.completedFuture(toDto(saved));
    }

    private static TeamMessageDto toDto(TeamMessage m) {
        return new TeamMessageDto(m.getId(), m.getTeamId(), m.getSender(), m.getBody(), m.getCreatedAt());
    }
}
