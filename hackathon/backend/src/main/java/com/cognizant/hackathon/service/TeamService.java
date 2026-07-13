package com.cognizant.hackathon.service;

import com.cognizant.hackathon.dto.PageResponse;
import com.cognizant.hackathon.dto.TeamDto;
import com.cognizant.hackathon.entity.Participant;
import com.cognizant.hackathon.entity.Team;
import com.cognizant.hackathon.entity.enums.TeamStatus;
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
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class TeamService {

    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("id", "name", "status");
    private static final Sort DEFAULT_SORT = Sort.by(Sort.Direction.ASC, "name");

    private final TeamRepository teamRepository;
    private final TeamRankingService rankingService;

    public List<TeamDto> getAllTeams() {
        return getAllTeams(Sort.unsorted());
    }

    @Transactional(readOnly = true)
    public List<TeamDto> getAllTeams(Sort sort) {
        Sort safeSort = SortSanitizer.sanitize(sort, ALLOWED_SORT_FIELDS, DEFAULT_SORT);
        Standings standings = rankingService.compute();
        return teamRepository.findAll(safeSort).stream()
                .map(t -> toDto(t, standings))
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
        return PageResponse.from(page.map(t -> toDto(t, standings)));
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
                    predicates.add(cb.equal(root.get("status"),
                            TeamStatus.valueOf(status.trim().toUpperCase())));
                } catch (IllegalArgumentException ignored) {
                    // Unknown status value → simply don't filter on it.
                }
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private static TeamDto toDto(Team t, Standings standings) {
        return new TeamDto(
                t.getId(),
                t.getName(),
                t.getHackathon() != null ? t.getHackathon().getTitle() : null,
                t.getStatus() != null ? t.getStatus().name() : null,
                standings.rankOf(t.getId()),
                standings.scoreOf(t.getId())
        );
    }
}
