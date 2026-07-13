package com.cognizant.hackathon.service;

import com.cognizant.hackathon.dto.EvaluateParticipantRequest;
import com.cognizant.hackathon.dto.PageResponse;
import com.cognizant.hackathon.dto.ParticipantDto;
import com.cognizant.hackathon.entity.Participant;
import com.cognizant.hackathon.entity.Team;
import com.cognizant.hackathon.entity.enums.ParticipantRole;
import com.cognizant.hackathon.exception.ResourceNotFoundException;
import com.cognizant.hackathon.repository.ParticipantRepository;
import com.cognizant.hackathon.util.SortSanitizer;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ParticipantService {

    private static final Set<String> ALLOWED_SORT_FIELDS =
            Set.of("id", "name", "email", "role", "technicalScore");
    private static final Sort DEFAULT_SORT = Sort.by(Sort.Direction.ASC, "name");

    private final ParticipantRepository participantRepository;

    public List<ParticipantDto> getAllParticipants() {
        return getAllParticipants(Sort.unsorted());
    }

    @Transactional(readOnly = true)
    public List<ParticipantDto> getAllParticipants(Sort sort) {
        Sort safeSort = SortSanitizer.sanitize(sort, ALLOWED_SORT_FIELDS, DEFAULT_SORT);
        return participantRepository.findAll(safeSort).stream()
                .map(ParticipantService::toDto)
                .toList();
    }

    /**
     * Paginated + sorted + searchable participants for the admin table. Search
     * matches name or email (case-insensitive); an optional role narrows to a
     * single {@link ParticipantRole}. Both filters compose (AND) and work with
     * pagination + whitelisted sort.
     */
    @Transactional(readOnly = true)
    public PageResponse<ParticipantDto> getParticipantsPage(
            String search, String role, String evaluation, Pageable pageable) {
        Pageable safePageable = SortSanitizer.sanitize(pageable, ALLOWED_SORT_FIELDS, DEFAULT_SORT);
        Specification<Participant> filter = searchFilter(search)
                .and(roleFilter(role))
                .and(evaluationFilter(evaluation));
        Page<Participant> page = participantRepository.findAll(filter, safePageable);
        return PageResponse.from(page.map(ParticipantService::toDto));
    }

    /**
     * Submits an individual talent evaluation: records the technical score (1-5) and
     * contribution type, and flips evaluationStatus so the roster reflects it.
     */
    @Transactional
    public ParticipantDto evaluateParticipant(Long id, EvaluateParticipantRequest request) {
        Participant participant = participantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Participant not found with id: " + id));
        participant.setTechnicalScore(request.technicalScore());
        participant.setContributionType(request.contributionType());
        participant.setEvaluationStatus(true);
        return toDto(participantRepository.save(participant));
    }

    private Specification<Participant> searchFilter(String search) {
        return (root, query, cb) -> {
            if (search == null || search.isBlank()) {
                return cb.conjunction(); // no filter
            }
            String like = "%" + search.trim().toLowerCase() + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("name")), like),
                    cb.like(cb.lower(root.get("email")), like));
        };
    }

    /**
     * Exact-match filter on the participant's role. An absent or unrecognized
     * value means "All Roles" (no restriction) rather than an error, so a stale
     * query param can never 500 the listing.
     */
    private Specification<Participant> roleFilter(String role) {
        return (root, query, cb) -> {
            if (role == null || role.isBlank()) {
                return cb.conjunction(); // All Roles
            }
            try {
                ParticipantRole parsed = ParticipantRole.valueOf(role.trim().toUpperCase());
                return cb.equal(root.get("role"), parsed);
            } catch (IllegalArgumentException ex) {
                return cb.conjunction(); // unknown role -> treat as All Roles
            }
        };
    }

    /**
     * Talent-pool filter. "TOP" = evaluated with a technical score of 4+ (top
     * performers); "PENDING" = not yet evaluated (needs evaluation). Any other/absent
     * value applies no restriction, so a stale query param can't 500 the listing.
     */
    private Specification<Participant> evaluationFilter(String evaluation) {
        return (root, query, cb) -> {
            if (evaluation == null || evaluation.isBlank()) {
                return cb.conjunction();
            }
            return switch (evaluation.trim().toUpperCase()) {
                case "TOP" -> cb.and(
                        cb.isTrue(root.get("evaluationStatus")),
                        cb.greaterThanOrEqualTo(root.get("technicalScore"), 4));
                case "PENDING" -> cb.or(
                        cb.isNull(root.get("evaluationStatus")),
                        cb.isFalse(root.get("evaluationStatus")));
                default -> cb.conjunction();
            };
        };
    }

    private static ParticipantDto toDto(Participant p) {
        Team team = p.getTeam();
        String teamName = team != null ? team.getName() : null;
        String hackathon = (team != null && team.getHackathon() != null)
                ? team.getHackathon().getTitle()
                : null;

        return new ParticipantDto(
                p.getId(),
                p.getName(),
                p.getEmail(),
                teamName,
                hackathon,
                p.getRole() != null ? p.getRole().name() : null,
                p.getTechnicalScore(),
                p.getContributionType() != null ? p.getContributionType().name() : null,
                Boolean.TRUE.equals(p.getEvaluationStatus())
        );
    }
}
