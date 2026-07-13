package com.cognizant.hackathon.service;

import com.cognizant.hackathon.dto.CreateSubmissionRequest;
import com.cognizant.hackathon.dto.HackathonOptionDto;
import com.cognizant.hackathon.dto.PageResponse;
import com.cognizant.hackathon.dto.SubmissionDto;
import com.cognizant.hackathon.entity.Hackathon;
import com.cognizant.hackathon.entity.Submission;
import com.cognizant.hackathon.entity.Team;
import com.cognizant.hackathon.entity.enums.SubmissionStatus;
import com.cognizant.hackathon.event.SubmissionCreatedEvent;
import com.cognizant.hackathon.event.SubmissionStatusChangedEvent;
import com.cognizant.hackathon.exception.ResourceNotFoundException;
import com.cognizant.hackathon.repository.HackathonRepository;
import com.cognizant.hackathon.repository.SubmissionRepository;
import com.cognizant.hackathon.repository.TeamRepository;
import com.cognizant.hackathon.security.TeamSecretValidator;
import com.cognizant.hackathon.util.SortSanitizer;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
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
public class SubmissionService {

    private static final Set<String> ALLOWED_SORT_FIELDS =
            Set.of("id", "projectTitle", "status", "score");
    private static final Sort DEFAULT_SORT = Sort.by(Sort.Direction.DESC, "id");

    private final SubmissionRepository submissionRepository;
    private final TeamRepository teamRepository;
    private final HackathonRepository hackathonRepository;
    private final TeamSecretValidator teamSecretValidator;
    private final ApplicationEventPublisher eventPublisher;

    /** Unsorted convenience overload (internal callers, e.g. the AI context builder). */
    public List<SubmissionDto> getAllSubmissions() {
        return getAllSubmissions(Sort.unsorted());
    }

    @Transactional(readOnly = true)
    public List<SubmissionDto> getAllSubmissions(Sort sort) {
        Sort safeSort = SortSanitizer.sanitize(sort, ALLOWED_SORT_FIELDS, DEFAULT_SORT);
        return submissionRepository.findAll(safeSort).stream()
                .map(SubmissionService::toDto)
                .toList();
    }

    /**
     * Paginated + sorted + filtered submissions for the Submission Tracking table.
     * Filters: {@code status} (e.g. PENDING for "Hide Reviewed") and {@code team}
     * (the Teams "View Details" pivot). Sort is whitelisted.
     */
    @Transactional(readOnly = true)
    public PageResponse<SubmissionDto> getSubmissionsPage(String status, String team, Pageable pageable) {
        Pageable safePageable = SortSanitizer.sanitize(pageable, ALLOWED_SORT_FIELDS, DEFAULT_SORT);
        Page<Submission> page = submissionRepository.findAll(submissionFilter(status, team), safePageable);
        return PageResponse.from(page.map(SubmissionService::toDto));
    }

    private Specification<Submission> submissionFilter(String status, String team) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (status != null && !status.isBlank()) {
                try {
                    predicates.add(cb.equal(root.get("status"),
                            SubmissionStatus.valueOf(status.trim().toUpperCase())));
                } catch (IllegalArgumentException ignored) {
                    // Unknown status value → simply don't filter on it.
                }
            }
            if (team != null && !team.isBlank()) {
                predicates.add(cb.equal(cb.lower(root.get("team").get("name")), team.trim().toLowerCase()));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    /** Public-safe hackathon list (id + title only) for the submission form dropdown. */
    @Transactional(readOnly = true)
    public List<HackathonOptionDto> listHackathonOptions() {
        return hackathonRepository.findAll().stream()
                .map(h -> new HackathonOptionDto(h.getId(), h.getTitle()))
                .toList();
    }

    @Transactional
    public SubmissionDto updateStatus(Long id, String statusValue) {
        Submission submission = findById(id);
        submission.setStatus(parseStatus(statusValue));
        Submission saved = submissionRepository.save(submission);

        String teamName = saved.getTeam() != null ? saved.getTeam().getName() : "A team";
        eventPublisher.publishEvent(new SubmissionStatusChangedEvent(
                saved.getId(),
                teamName,
                saved.getProjectTitle(),
                saved.getStatus() != null ? saved.getStatus().name() : null));

        return toDto(saved);
    }

    /**
     * Creates a PENDING submission with per-hackathon (multi-tenant) secret scoping.
     * Strict order: (1) resolve the hackathon by name [404], (2) verify the
     * X-Team-Secret against THAT hackathon's secret [401], (3) only then resolve the
     * team within that hackathon [404]. Publishes a SubmissionCreatedEvent on success.
     *
     * @param providedSecret the raw X-Team-Secret header value from the request
     */
    @Transactional
    public SubmissionDto createSubmission(CreateSubmissionRequest request, String providedSecret) {
        String hackathonName = trimToNull(request.hackathonName());
        String teamName = trimToNull(request.teamName());
        String projectTitle = trimToNull(request.projectTitle());
        String repoLink = trimToNull(request.repoLink());

        if (hackathonName == null || teamName == null || projectTitle == null || repoLink == null) {
            throw new IllegalArgumentException(
                    "hackathonName, teamName, projectTitle and repoLink are all required");
        }

        // Step 1 — find the hackathon (404 if it doesn't exist).
        Hackathon hackathon = hackathonRepository.findFirstByTitle(hackathonName)
                .orElseThrow(() -> new ResourceNotFoundException("Hackathon not found with name: " + hackathonName));

        // Step 2 — verify the secret against THIS hackathon (401 on mismatch/missing).
        teamSecretValidator.validate(providedSecret, hackathon.getSubmissionSecret());

        // Step 3 — only now resolve the team, scoped to this hackathon (404 if absent here).
        Team team = teamRepository.findFirstByNameAndHackathonId(teamName, hackathon.getId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Team '" + teamName + "' not found in hackathon '" + hackathonName + "'"));

        Submission saved = submissionRepository.save(Submission.builder()
                .projectTitle(projectTitle)
                .repositoryUrl(repoLink)
                .status(SubmissionStatus.PENDING)
                .team(team)
                .hackathon(hackathon)
                .build());

        eventPublisher.publishEvent(
                new SubmissionCreatedEvent(saved.getId(), team.getName(), saved.getProjectTitle()));

        return toDto(saved);
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private Submission findById(Long id) {
        return submissionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Submission not found with id: " + id));
    }

    private SubmissionStatus parseStatus(String value) {
        try {
            return SubmissionStatus.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException | NullPointerException e) {
            throw new IllegalArgumentException("Invalid submission status: " + value);
        }
    }

    private static SubmissionDto toDto(Submission s) {
        return new SubmissionDto(
                s.getId(),
                s.getTeam() != null ? s.getTeam().getName() : null,
                s.getTeam() != null ? s.getTeam().getId() : null,
                s.getHackathon() != null ? s.getHackathon().getTitle() : null,
                s.getHackathon() != null ? s.getHackathon().getId() : null,
                s.getProjectTitle(),
                s.getRepositoryUrl(),
                s.getStatus() != null ? s.getStatus().name() : null,
                s.getScore(),
                s.getGradedBy()
        );
    }
}
