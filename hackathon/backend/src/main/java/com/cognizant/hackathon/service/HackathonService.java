package com.cognizant.hackathon.service;

import com.cognizant.hackathon.entity.Hackathon;
import com.cognizant.hackathon.event.HackathonCreatedEvent;
import com.cognizant.hackathon.event.HackathonDeletedEvent;
import com.cognizant.hackathon.event.HackathonUpdatedEvent;
import com.cognizant.hackathon.exception.ResourceNotFoundException;
import com.cognizant.hackathon.repository.HackathonRepository;
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
        validateDateRange(hackathon.getStartDate(), hackathon.getEndDate());
        Hackathon saved = hackathonRepository.save(hackathon);
        eventPublisher.publishEvent(new HackathonCreatedEvent(saved.getId(), saved.getTitle()));
        return saved;
    }

    @Transactional
    public Hackathon updateHackathon(Long id, Hackathon updatedData) {
        validateDateRange(updatedData.getStartDate(), updatedData.getEndDate());
        Hackathon existing = getHackathonById(id);

        existing.setTitle(updatedData.getTitle());
        existing.setDescription(updatedData.getDescription());
        existing.setStartDate(updatedData.getStartDate());
        existing.setEndDate(updatedData.getEndDate());
        existing.setStatus(updatedData.getStatus());
        // Only rotate the per-hackathon submission secret when one is supplied, so an
        // update that omits it (the common case) doesn't accidentally wipe it.
        if (updatedData.getSubmissionSecret() != null) {
            existing.setSubmissionSecret(updatedData.getSubmissionSecret());
        }

        Hackathon saved = hackathonRepository.save(existing);
        eventPublisher.publishEvent(new HackathonUpdatedEvent(saved.getId(), saved.getTitle()));
        return saved;
    }

    /** Cross-field rule the @NotNull annotations can't express: end must not precede start. */
    private void validateDateRange(LocalDate startDate, LocalDate endDate) {
        if (startDate != null && endDate != null && endDate.isBefore(startDate)) {
            throw new IllegalArgumentException("End date must be on or after the start date");
        }
    }

    @Transactional
    public void deleteHackathon(Long id) {
        Hackathon existing = getHackathonById(id);
        // Capture identity before deletion — the entity is gone once we delete.
        Long deletedId = existing.getId();
        String title = existing.getTitle();
        hackathonRepository.delete(existing);
        eventPublisher.publishEvent(new HackathonDeletedEvent(deletedId, title));
    }
}
