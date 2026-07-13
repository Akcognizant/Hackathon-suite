package com.cognizant.hackathon.event;

import com.cognizant.hackathon.repository.SubmissionRepository;
import com.cognizant.hackathon.service.ActivityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Dedicated AFTER_COMMIT sink for project-submission events, kept physically
 * separate from {@link ActivityEventListener} so the submission flow is decoupled
 * from the import/hackathon audit handlers. Delegates to {@link ActivityService},
 * which writes in its own (REQUIRES_NEW) transaction.
 *
 * <p>Activity logging is best-effort: the handler swallows its own exceptions so a
 * logging failure can never affect the (already committed) submission.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class SubmissionEventListener {

    private final ActivityService activityService;
    private final SubmissionRepository submissionRepository;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onSubmissionCreated(SubmissionCreatedEvent event) {
        safe(() -> activityService.recordActivity(
                submissionRepository.getReferenceById(event.submissionId()),
                event.teamName() + " submitted \"" + event.projectTitle() + "\"",
                "SUBMISSION_CREATED"));
    }

    /** Run an activity-recording action, logging (never rethrowing) any failure. */
    private void safe(Runnable action) {
        try {
            action.run();
        } catch (Exception ex) {
            log.error("Failed to record submission activity entry", ex);
        }
    }
}
