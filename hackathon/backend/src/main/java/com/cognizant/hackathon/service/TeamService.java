package com.cognizant.hackathon.service;

import com.cognizant.hackathon.dto.PageResponse;
import com.cognizant.hackathon.dto.TeamDto;
import com.cognizant.hackathon.entity.Participant;
import com.cognizant.hackathon.entity.Submission;
import com.cognizant.hackathon.entity.Team;
import com.cognizant.hackathon.entity.enums.SubmissionStatus;
import com.cognizant.hackathon.repository.SubmissionRepository;
import com.cognizant.hackathon.repository.TeamRepository;
import com.cognizant.hackathon.service.TeamRankingService.Standings;
import com.cognizant.hackathon.util.SortSanitizer;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class TeamService {

    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("id", "name", "status");
    private static final Sort DEFAULT_SORT = Sort.by(Sort.Direction.ASC, "name");

    private final TeamRepository teamRepository;
    private final SubmissionRepository submissionRepository;
    private final TeamRankingService rankingService;

    public List<TeamDto> getAllTeams() {
        return getAllTeams(Sort.unsorted());
    }

    @Transactional(readOnly = true)
    public List<TeamDto> getAllTeams(Sort sort) {
        Sort safeSort = SortSanitizer.sanitize(sort, ALLOWED_SORT_FIELDS, DEFAULT_SORT);
        Standings standings = rankingService.compute();
        List<Team> teams = teamRepository.findAll(safeSort);
        Map<Long, String> reviewStatus = reviewStatusByTeam(teams);
        return teams.stream()
                .map(t -> toDto(t, standings, reviewStatus))
                .toList();
    }

    /**
     * Paginated + sorted teams for the scouting directory. Optional filters: name
     * search (case-insensitive) and submission status. Sort is whitelisted; each row
     * carries its globally-computed rank/score so the scouting UI needn't derive it.
     */
    @Transactional(readOnly = true)
    public PageResponse<TeamDto> getTeamsPage(String search, String status, Pageable pageable) {
        Pageable safePageable = SortSanitizer.sanitize(pageable, ALLOWED_SORT_FIELDS, DEFAULT_SORT);
        Standings standings = rankingService.compute();
        Page<Team> page = teamRepository.findAll(teamFilter(search, status), safePageable);
        Map<Long, String> reviewStatus = reviewStatusByTeam(page.getContent());
        return PageResponse.from(page.map(t -> toDto(t, standings, reviewStatus)));
    }

    private Specification<Team> teamFilter(String search, String status) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (search != null && !search.isBlank()) {
                String like = "%" + search.trim().toLowerCase() + "%";
                // Match the team name OR any member's name. The member check is an
                // EXISTS subquery on participants, so it works with pagination and
                // never duplicates team rows the way a join would.
                Subquery<Long> memberMatch = query.subquery(Long.class);
                Root<Participant> member = memberMatch.from(Participant.class);
                memberMatch.select(member.get("id")).where(
                        cb.equal(member.get("team"), root),
                        cb.like(cb.lower(member.get("name")), like));
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("name")), like),
                        cb.exists(memberMatch)));
            }
            if (status != null && !status.isBlank()) {
                try {
                    // Filter by the team's PROJECT review status (its submission's status)
                    // so the filter matches the status shown on each card. EXISTS keeps it
                    // pagination-safe and avoids duplicating team rows a join would create.
                    SubmissionStatus reviewStatus = SubmissionStatus.valueOf(status.trim().toUpperCase());
                    Subquery<Long> statusMatch = query.subquery(Long.class);
                    Root<Submission> submission = statusMatch.from(Submission.class);
                    statusMatch.select(submission.get("id")).where(
                            cb.equal(submission.get("team"), root),
                            cb.equal(submission.get("status"), reviewStatus));
                    predicates.add(cb.exists(statusMatch));
                } catch (IllegalArgumentException ignored) {
                    // Unknown status value → simply don't filter on it.
                }
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    /**
     * Maps each given team to its project review status (its submission's status). When
     * a team has several submissions, a decided status (APPROVED/REJECTED) wins over a
     * still-PENDING one. Teams with no submission are absent (caller falls back to the
     * team's own registration status).
     */
    private Map<Long, String> reviewStatusByTeam(List<Team> teams) {
        List<Long> teamIds = teams.stream().map(Team::getId).toList();
        if (teamIds.isEmpty()) {
            return Map.of();
        }
        Map<Long, String> statusByTeam = new HashMap<>();
        for (Submission submission : submissionRepository.findByTeamIdIn(teamIds)) {
            if (submission.getTeam() == null || submission.getStatus() == null) {
                continue;
            }
            statusByTeam.merge(
                    submission.getTeam().getId(),
                    submission.getStatus().name(),
                    (existing, incoming) -> "PENDING".equals(existing) ? incoming : existing);
        }
        return statusByTeam;
    }

    private static TeamDto toDto(Team t, Standings standings, Map<Long, String> reviewStatus) {
        // Prefer the project's review status; fall back to the team's registration status.
        String status = reviewStatus.get(t.getId());
        if (status == null) {
            status = t.getStatus() != null ? t.getStatus().name() : null;
        }
        return new TeamDto(
                t.getId(),
                t.getName(),
                t.getHackathon() != null ? t.getHackathon().getTitle() : null,
                status,
                standings.rankOf(t.getId()),
                standings.scoreOf(t.getId()),
                standings.percentOf(t.getId())
        );
    }
}
