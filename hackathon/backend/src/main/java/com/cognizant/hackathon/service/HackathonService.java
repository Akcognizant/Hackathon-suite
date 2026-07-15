package com.cognizant.hackathon.service;

import com.cognizant.hackathon.entity.Hackathon;
import com.cognizant.hackathon.entity.Submission;
import com.cognizant.hackathon.entity.Team;
import com.cognizant.hackathon.event.HackathonCreatedEvent;
import com.cognizant.hackathon.event.HackathonDeletedEvent;
import com.cognizant.hackathon.event.HackathonUpdatedEvent;
import com.cognizant.hackathon.exception.ResourceNotFoundException;
import com.cognizant.hackathon.repository.ActivityRepository;
import com.cognizant.hackathon.repository.HackathonRepository;
import com.cognizant.hackathon.repository.LeaderboardRepository;
import com.cognizant.hackathon.repository.ParticipantRepository;
import com.cognizant.hackathon.repository.RubricCriterionRepository;
import com.cognizant.hackathon.repository.ScoreRepository;
import com.cognizant.hackathon.repository.SubmissionRepository;
import com.cognizant.hackathon.repository.TeamMessageRepository;
import com.cognizant.hackathon.repository.TeamRepository;
import com.cognizant.hackathon.util.SortSanitizer;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class HackathonService {

    // Whitelisted sort columns for the admin table + a safe fallback. Anything else
    // a client sends is dropped (prevents PropertyReferenceException / HTTP 500).
    private static final Set<String> ALLOWED_SORT_FIELDS =
            Set.of("id", "title", "startDate", "endDate", "status");
    private static final Sort DEFAULT_SORT = Sort.by(Sort.Direction.ASC, "startDate");

    private final HackathonRepository hackathonRepository;
    private final SubmissionRepository submissionRepository;
    private final TeamRepository teamRepository;
    private final ParticipantRepository participantRepository;
    private final RubricCriterionRepository rubricCriterionRepository;
    private final ScoreRepository scoreRepository;
    private final ActivityRepository activityRepository;
    private final LeaderboardRepository leaderboardRepository;
    private final TeamMessageRepository teamMessageRepository;
    private final ApplicationEventPublisher eventPublisher;

    public List<Hackathon> getAllHackathons() {
        return hackathonRepository.findAll();
    }

    /** Paginated + sorted + filtered page for the admin table. Sort is whitelisted. */
    @Transactional(readOnly = true)
    public Page<Hackathon> getHackathons(String search, String status, Pageable pageable) {
        Pageable safePageable = SortSanitizer.sanitize(pageable, ALLOWED_SORT_FIELDS, DEFAULT_SORT);
        return hackathonRepository.findAll(filter(search, status), safePageable);
    }

    /** The full filtered + sorted set (no paging) for CSV export. Sort is whitelisted. */
    @Transactional(readOnly = true)
    public List<Hackathon> findForExport(String search, String status, Sort sort) {
        Sort safeSort = SortSanitizer.sanitize(sort, ALLOWED_SORT_FIELDS, DEFAULT_SORT);
        return hackathonRepository.findAll(filter(search, status), safeSort);
    }

    /**
     * Builds an optional-filter Specification: title contains {@code search}
     * (case-insensitive) AND status equals {@code status}. Blank/null params are
     * skipped, so the same builder serves the table and the export.
     */
    private Specification<Hackathon> filter(String search, String status) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (search != null && !search.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("title")),
                        "%" + search.trim().toLowerCase() + "%"));
            }
            if (status != null && !status.isBlank()) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    public Hackathon getHackathonById(Long id) {
        return hackathonRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hackathon not found with id: " + id));
    }

    @Transactional
    public Hackathon createHackathon(Hackathon hackathon) {
        // A brand-new event may not start in the past. (Not enforced on update, so an
        // already-running/finished event whose start is legitimately past stays editable.)
        validateStartNotInPast(hackathon.getStartDate());
        validateDateRange(hackathon.getStartDate(), hackathon.getEndDate());
        validateTeamSize(hackathon.getMinTeamSize(), hackathon.getMaxTeamSize());
        // Status is derived from the dates, never taken from the client.
        hackathon.setStatus(computeStatus(hackathon.getStartDate(), hackathon.getEndDate()));
        Hackathon saved = hackathonRepository.save(hackathon);
        eventPublisher.publishEvent(new HackathonCreatedEvent(saved.getId(), saved.getTitle()));
        return saved;
    }

    @Transactional
    public Hackathon updateHackathon(Long id, Hackathon updatedData) {
        validateDateRange(updatedData.getStartDate(), updatedData.getEndDate());
        validateTeamSize(updatedData.getMinTeamSize(), updatedData.getMaxTeamSize());
        Hackathon existing = getHackathonById(id);

        existing.setTitle(updatedData.getTitle());
        existing.setDescription(updatedData.getDescription());
        existing.setStartDate(updatedData.getStartDate());
        existing.setEndDate(updatedData.getEndDate());
        // Status is recomputed from the (possibly changed) dates, not taken from the client.
        existing.setStatus(computeStatus(updatedData.getStartDate(), updatedData.getEndDate()));
        // Team-size bounds are always mirrored (null clears the limit) so an edit can
        // both set and remove them.
        existing.setMinTeamSize(updatedData.getMinTeamSize());
        existing.setMaxTeamSize(updatedData.getMaxTeamSize());
        // Only rotate the per-hackathon submission secret when one is supplied, so an
        // update that omits it (the common case) doesn't accidentally wipe it.
        if (updatedData.getSubmissionSecret() != null) {
            existing.setSubmissionSecret(updatedData.getSubmissionSecret());
        }

        Hackathon saved = hackathonRepository.save(existing);
        eventPublisher.publishEvent(new HackathonUpdatedEvent(saved.getId(), saved.getTitle()));
        return saved;
    }

    /**
     * Derives an event's lifecycle status purely from its dates:
     * before the start date it's UPCOMING, on/between start and end it's ACTIVE, and
     * after the end date it's COMPLETED. This is the single source of truth for status —
     * admins no longer set it by hand.
     */
    private String computeStatus(LocalDate startDate, LocalDate endDate) {
        LocalDate today = LocalDate.now();
        if (startDate != null && today.isBefore(startDate)) {
            return "UPCOMING";
        }
        if (endDate != null && today.isAfter(endDate)) {
            return "COMPLETED";
        }
        return "ACTIVE";
    }

    /**
     * Keeps stored statuses in step with the calendar so an event flips
     * UPCOMING → ACTIVE → COMPLETED on its own as the dates pass — no edit needed.
     * Runs shortly after startup and then hourly (status only changes at day
     * boundaries, so hourly is ample). Only rows whose status actually changed are
     * saved, and no activity events are emitted (this isn't a user action).
     */
    @Scheduled(initialDelay = 10_000, fixedDelay = 3_600_000)
    @Transactional
    public void refreshStatuses() {
        for (Hackathon hackathon : hackathonRepository.findAll()) {
            String current = computeStatus(hackathon.getStartDate(), hackathon.getEndDate());
            if (!current.equals(hackathon.getStatus())) {
                hackathon.setStatus(current);
                hackathonRepository.save(hackathon);
            }
        }
    }

    /** Cross-field rule the @NotNull annotations can't express: end must not precede start. */
    private void validateDateRange(LocalDate startDate, LocalDate endDate) {
        if (startDate != null && endDate != null && endDate.isBefore(startDate)) {
            throw new IllegalArgumentException("End date must be on or after the start date");
        }
    }

    /**
     * Validates the optional team-size bounds. Either may be null (no limit), but when
     * present each must be at least 1 and the maximum must not be below the minimum.
     */
    private void validateTeamSize(Integer minTeamSize, Integer maxTeamSize) {
        if (minTeamSize != null && minTeamSize < 1) {
            throw new IllegalArgumentException("Minimum team size must be at least 1");
        }
        if (maxTeamSize != null && maxTeamSize < 1) {
            throw new IllegalArgumentException("Maximum team size must be at least 1");
        }
        if (minTeamSize != null && maxTeamSize != null && maxTeamSize < minTeamSize) {
            throw new IllegalArgumentException(
                    "Maximum team size must be greater than or equal to the minimum team size");
        }
    }

    /** Rejects a start date earlier than today (used only when creating a new event). */
    private void validateStartNotInPast(LocalDate startDate) {
        if (startDate != null && startDate.isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Start date cannot be in the past");
        }
    }

    /**
     * Deletes a hackathon together with everything that references it. A plain
     * {@code hackathonRepository.delete()} fails with a foreign-key violation
     * (surfacing in the UI as "failed to delete") because teams, submissions, rubric
     * criteria — and, transitively, participants, scores, activity-feed entries,
     * score breakdowns, team messages and leaderboard rows — all point back at the
     * hackathon. We therefore remove the dependents first, in FK-safe order
     * (leaves before parents), then the hackathon itself.
     */
    @Transactional
    public void deleteHackathon(Long id) {
        Hackathon existing = getHackathonById(id);
        // Capture identity before deletion — the entity is gone once we delete.
        Long deletedId = existing.getId();
        String title = existing.getTitle();

        // 1) Submissions and everything hanging off them (scores, activity links).
        //    submission_score_breakdown is an @ElementCollection, so Hibernate clears
        //    it automatically when each Submission entity is removed via deleteAll().
        List<Submission> submissions = submissionRepository.findByHackathonId(id);
        if (!submissions.isEmpty()) {
            List<Long> submissionIds = submissions.stream().map(Submission::getId).toList();
            activityRepository.deleteBySubmissionIdIn(submissionIds);
            scoreRepository.deleteBySubmissionIdIn(submissionIds);
            submissionRepository.deleteAll(submissions);
        }

        // 2) Teams and their dependents (participants + admin->team message logs).
        List<Team> teams = teamRepository.findByHackathonId(id);
        if (!teams.isEmpty()) {
            List<Long> teamIds = teams.stream().map(Team::getId).toList();
            participantRepository.deleteByTeamIdIn(teamIds);
            teamMessageRepository.deleteByTeamIdIn(teamIds);
            teamRepository.deleteAll(teams);
        }

        // 3) Rubric criteria and pre-computed leaderboard rows for this event.
        rubricCriterionRepository.deleteByHackathonId(id);
        leaderboardRepository.deleteByEventId(id);

        // 4) Finally the hackathon itself — no dependents remain.
        hackathonRepository.delete(existing);
        eventPublisher.publishEvent(new HackathonDeletedEvent(deletedId, title));
    }
}
