package com.cognizant.hackathon.event;

import com.cognizant.hackathon.repository.SubmissionRepository;
import com.cognizant.hackathon.service.ActivityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Single, standardized sink for all audit events. Every handler runs AFTER_COMMIT,
 * so an activity entry is created only when the originating business transaction
 * actually persisted. Handlers delegate to {@link ActivityService#recordActivity},
 * which writes in its own (REQUIRES_NEW) transaction.
 *
 * <p>Activity logging is best-effort: each handler swallows its own exceptions so a
 * logging failure can never affect the (already committed) operation that triggered it.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ActivityEventListener {

    private final ActivityService activityService;
    private final SubmissionRepository submissionRepository;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onSubmissionScored(SubmissionScoredEvent event) {
        // Audit format: "[gradedBy] scored [TeamName]: [Score]".
        String evaluator = (event.gradedBy() == null || event.gradedBy().isBlank())
                ? "Someone"
                : event.gradedBy();
        String message = evaluator + " scored " + event.teamName() + ": " + event.score();
        safe(() -> activityService.recordActivity(
                submissionRepository.getReferenceById(event.submissionId()),
                message,
                "SCORE_ASSIGNED"));
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onSubmissionStatusChanged(SubmissionStatusChangedEvent event) {
        String status = event.newStatus() == null ? "" : event.newStatus().toUpperCase();
        String message;
        String type;
        switch (status) {
            case "APPROVED" -> {
                message = event.teamName() + " approved for scoring";
                type = "SUBMISSION_APPROVED";
            }
            case "REJECTED" -> {
                message = event.teamName() + "'s submission was rejected";
                type = "SUBMISSION_REJECTED";
            }
            default -> {
                message = event.teamName() + "'s submission marked " + status;
                type = "SUBMISSION_STATUS_CHANGED";
            }
        }
        final String finalMessage = message;
        final String finalType = type;
        safe(() -> activityService.recordActivity(
                submissionRepository.getReferenceById(event.submissionId()), finalMessage, finalType));
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onHackathonCreated(HackathonCreatedEvent event) {
        safe(() -> activityService.recordActivity("Hackathon created: " + event.title(), "HACKATHON_CREATED"));
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onHackathonUpdated(HackathonUpdatedEvent event) {
        safe(() -> activityService.recordActivity("Hackathon updated: " + event.title(), "HACKATHON_UPDATED"));
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onHackathonDeleted(HackathonDeletedEvent event) {
        safe(() -> activityService.recordActivity("Hackathon deleted: " + event.title(), "HACKATHON_DELETED"));
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onTeamRegistered(TeamRegisteredEvent event) {
        safe(() -> activityService.recordActivity("New team registered: " + event.teamName(), "TEAM_REGISTERED"));
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onParticipantsImported(ParticipantsImportedEvent event) {
        safe(() -> activityService.recordActivity(
                "Imported " + event.processed() + " participants ("
                        + event.created() + " new, " + event.updated() + " updated)",
                "PARTICIPANTS_IMPORTED"));
    }

    /** Run an activity-recording action, logging (never rethrowing) any failure. */
    private void safe(Runnable action) {
        try {
            action.run();
        } catch (Exception ex) {
            log.error("Failed to record activity entry", ex);
        }
    }
}
