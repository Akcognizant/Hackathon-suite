package com.cognizant.hackathon.service;

import com.cognizant.hackathon.dto.AssignScoreRequest;
import com.cognizant.hackathon.dto.ParticipantEvaluation;
import com.cognizant.hackathon.dto.ScoreResponse;
import com.cognizant.hackathon.entity.Participant;
import com.cognizant.hackathon.entity.Score;
import com.cognizant.hackathon.entity.Submission;
import com.cognizant.hackathon.exception.ResourceNotFoundException;
import com.cognizant.hackathon.event.SubmissionScoredEvent;
import com.cognizant.hackathon.repository.ParticipantRepository;
import com.cognizant.hackathon.repository.ScoreRepository;
import com.cognizant.hackathon.repository.SubmissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ScoreService {

    private final SubmissionRepository submissionRepository;
    private final ScoreRepository scoreRepository;
    private final ParticipantRepository participantRepository;
    private final LeaderboardService leaderboardService;
    private final ApplicationEventPublisher eventPublisher;

    /**
     * Assigns (or re-assigns) a submission's score: persists it in the scores
     * table, keeps the submission's own score in sync, and rebuilds the event
     * leaderboard so rankings stay current.
     */
    @Transactional
    public ScoreResponse assignScore(AssignScoreRequest request) {
        Submission submission = submissionRepository.findById(request.submissionId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Submission not found with id: " + request.submissionId()));

        // Audit: capture who is grading from the security context (JWT principal = email).
        String gradedBy = currentUsername();

        Score score = scoreRepository.findBySubmissionId(submission.getId())
                .orElseGet(Score::new);
        score.setSubmission(submission);
        score.setValue(request.score());
        score.setGradedBy(gradedBy);
        scoreRepository.save(score);

        submission.setScore(request.score());
        submission.setGradedBy(gradedBy); // mirror onto the submission for table display
        if (request.remarks() != null) {
            String trimmed = request.remarks().trim();
            submission.setFeedback(trimmed.isEmpty() ? null : trimmed);
        }
        submissionRepository.save(submission);

        // Individual member evaluations persist in THIS same transaction, so the
        // project score and talent ratings commit (or roll back) atomically.
        applyMemberEvaluations(request.evaluations());

        Long eventId = submission.getHackathon() != null ? submission.getHackathon().getId() : null;
        if (eventId != null) {
            leaderboardService.recompute(eventId);
        }

        // Decoupled side effect: an AFTER_COMMIT listener turns this into an
        // activity-feed entry once the score is durably persisted.
        String teamName = submission.getTeam() != null ? submission.getTeam().getName() : "a team";
        eventPublisher.publishEvent(
                new SubmissionScoredEvent(submission.getId(), teamName, request.score(), gradedBy));

        return new ScoreResponse(submission.getId(), request.score(), eventId, gradedBy);
    }

    /**
     * Records individual talent evaluations for team members. Runs inside the caller's
     * {@code @Transactional} scope, so a bad memberId rolls back the whole grading op.
     */
    private void applyMemberEvaluations(List<ParticipantEvaluation> evaluations) {
        if (evaluations == null || evaluations.isEmpty()) {
            return;
        }
        for (ParticipantEvaluation evaluation : evaluations) {
            Participant member = participantRepository.findById(evaluation.memberId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Participant not found with id: " + evaluation.memberId()));
            member.setTechnicalScore(evaluation.score());
            member.setContributionType(evaluation.role());
            member.setEvaluationStatus(true);
            participantRepository.save(member);
        }
    }

    /** The authenticated user's name (email for JWT logins); "system" if unauthenticated. */
    private String currentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && auth.getName() != null) {
            return auth.getName();
        }
        return "system";
    }
}
